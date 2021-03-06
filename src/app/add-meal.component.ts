import { Component, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MealName, MealItem, Data, Meal } from './services/data';
import { MatStepper } from '@angular/material/stepper';
import * as moment from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { timeToTime } from './services/util';
import { Observable } from 'rxjs';
import { debounceTime, switchMap, } from 'rxjs/operators';
import { MatAutocomplete } from '@angular/material';
import { Sync } from './services/sync';

@Component({
    selector: 'add-meal',
    templateUrl: './add-meal.html',
    styleUrls: ['./add-meal.scss']
})
export class AddMealComponent implements OnInit {
    mealName: MealName = MealName.Breakfast;
    mealDate: moment.Moment = moment();
    items: MealItem[] = [];
    basicInfo: FormGroup;
    addFood: FormGroup;
    mealNames = Object.getOwnPropertyNames(MealName).map(name => MealName[name]);
    @ViewChild(MatStepper)
    stepper: MatStepper;
    columnsToDisplay = ['name', 'calories', 'carbs', 'fat', 'protein', 'delete'];
    confirmColumns = ['name', 'calories', 'carbs', 'fat', 'protein'];
    recommendedFoods: Observable<MealItem[]>;
    loading = true;
    @ViewChild(MatAutocomplete)
    autoComplete: MatAutocomplete;
    constructor(
        private builder: FormBuilder,
        private data: Data,
        private router: Router,
        private route: ActivatedRoute,
    ) { }
    async ngOnInit() {
        this.basicInfo = this.builder.group({
            date: this.mealDate,
            time: this.mealDate.format('HH:mm'),
            name: this.mealName,
        });

        this.basicInfo.valueChanges.subscribe(change => {
            this.mealName = change.name;
            const mealDate = change.date;
            const time = timeToTime(change.time);
            mealDate.hours(time.hours);
            mealDate.minutes(time.minutes);
            this.mealDate = mealDate;
        });
        this.addFood = this.builder.group({
            desc: '',
            calories: null,
            carbs: null,
            fat: null,
            protein: null,
        });
        const desc = this.addFood.get('desc');
        this.recommendedFoods = desc.valueChanges.pipe(
            debounceTime(300),
            switchMap((v, i) => this.getRecommendations(v))
        );
        this.autoComplete.optionSelected.subscribe(value => {
            this.data.mealItems.get(value.option.value).then(food => {
                this.addFood.setValue({
                    desc: `${food.name}`,
                    calories: food.calories,
                    carbs: food.carbs,
                    fat: food.fat,
                    protein: food.protein,
                }, {emitEvent: false, onlySelf: true});
            });
        });
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            console.log('getting info from db');
            let meal;
            let day;
            try {
                meal = await this.data.getMeal(id);
                console.log('got meal', meal);
                day = await this.data.days.get(meal.dayId);
            } catch (e) {
                console.error('error getting info from db', e);
            }
            this.mealDate = moment(day.date);
            this.mealDate.hours(meal.time.hours);
            this.mealDate.minutes(meal.time.minutes);
            this.setBasicInfo(meal.name);
            this.items = meal.contents;
        }
        try {
            const day = await this.data.getTodaysEntries();
            const name = this.getNextMealFrom(day.meals);
            this.basicInfo.setValue({date: this.mealDate,
                time: this.mealDate.format('HH:mm'),
                name,
            });
        } catch (e) {
            console.error(e);
        }
        this.loading = false;
        console.log('ngOnInit end');
    }

    getNextMealFrom(meals: Meal[]): MealName {
        const reducer = {breakfast: false, lunch: false, dinner: false, tea: false};
        const {breakfast, lunch, dinner, tea} = meals.reduce((acc, item) => {
            switch (item.name) {
                case MealName.Breakfast:
                    acc.breakfast = true;
                    break;
                case MealName.Lunch:
                    acc.lunch = true;
                    break;
                case MealName.Tea:
                    acc.tea = true;
                    break;
                case MealName.Dinner:
                    acc.dinner = true;
                    break;
            }
            return acc;
        }, reducer);
        if (!breakfast) {
            return MealName.Breakfast;
        } else if (!lunch) {
            return MealName.Lunch;
        } else if (!tea) {
            return MealName.Tea;
        } else if (!dinner) {
            return MealName.Dinner;
        } else {
            return MealName.Snack;
        }
    }

    setBasicInfo(name: MealName) {
        this.basicInfo.setValue({
            date: this.mealDate,
            time: this.mealDate.format('HH:mm'),
            name
        });
    }

    async getRecommendations(term: string) {
        if (typeof term !== 'string') {
            return [];
        }
        const result = await this.data.findFood(term);
        return result.reduce((acc, v) => {
            if (acc.known.has(v.name)) {
                return acc;
            }
            acc.known.add(v.name);
            acc.ret.push(v);
            return acc;
        }, {ret: [], known: new Set()}).ret;
    }

    addMealItem() {
        const values = this.addFood.value;
        this.items = this.items.concat([new MealItem(
            values.desc,
            values.calories,
            values.carbs,
            values.protein,
            values.fat)
        ]);
        this.addFood.reset({desc: '', calories: null, carbs: null, fat: null, protein: null});
    }

    removeItem(idx: number) {
        this.items = this.items.filter((_, i) => i !== idx);
    }

    saveMeal() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.data.updateMeal(id, this.mealDate, this.mealName, this.items).then(() => {
                this.router.navigate(['/']);
            });
        } else {
            this.data.addMeal(this.mealDate, this.mealName, this.items).then(() => {
                this.router.navigate(['/']);
            });
        }
    }

    get calories(): number {
        return this.items.reduce((a, c) => a + c.calories || 0, 0);
    }
    get carbs(): number {
        return this.items.reduce((a, c) => a + c.carbs || 0, 0);
    }
    get fat(): number {
        return this.items.reduce((a, c) => a + c.fat || 0, 0);
    }
    get protein(): number {
        return this.items.reduce((a, c) => a + c.protein || 0, 0);
    }

    calcCals() {
        const values = this.addFood.value;
        const fromCarbs = values.carbs * 4;
        const fromProt = values.protein * 4;
        const fromFat = values.fat * 9;
        values.calories = fromCarbs + fromProt + fromFat;
        this.addFood.setValue(values);
    }
}
