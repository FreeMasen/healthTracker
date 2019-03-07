import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MealName, MealItem, Data, IFoodDesc } from './services/data';
import { MatStepper } from '@angular/material/stepper';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { timeToTime } from './services/util';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap, } from 'rxjs/operators';
import { MatAutocomplete } from '@angular/material';

@Component({
    selector: 'add-meal',
    templateUrl: './add-meal.html',
})
export class AddMealComponent {
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
    @ViewChild(MatAutocomplete)
    autoComplete: MatAutocomplete;
    constructor(
        private builder: FormBuilder,
        private data: Data,
        private router: Router,
    ) { }
    async ngOnInit() {
        this.basicInfo = this.builder.group({
            date: this.mealDate,
            time: this.mealDate.format('HH:mm'),
            name: MealName.Breakfast,
        });
        this.basicInfo.valueChanges.subscribe(change => {
            this.mealName = change.name;
            let mealDate = change.date;
            let time = timeToTime(change.time);
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
        let desc = this.addFood.get('desc');
        this.recommendedFoods = desc.valueChanges.pipe(
            debounceTime(300),
            switchMap((v, i) => this.getRecommendations(v))
        )
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
    }

    async getRecommendations(v: string) {
        if (typeof v !== 'string') {
            return [];
        }
        let result = await this.data.findFood(v);
        return result;
    }

    addMealItem() {
        let values = this.addFood.value;
        this.items = this.items.concat([new MealItem(values.desc, values.calories, values.carbs, values.protein, values.fat)])
        this.addFood.reset({desc: '', calories: null, carbs: null, fat: null, protein: null});
    }

    removeItem(idx: number) {
        this.items = this.items.filter((_,i) => i !== idx);
    }

    saveMeal() {        
        this.data.addMeal(this.mealDate, this.mealName, this.items).then(() => {
            this.router.navigate(['/']);
        });
    }

    get calories(): number {
        return this.items.reduce((a, c) => a + c.calories || 0, 0)
    }
    get carbs(): number {
        return this.items.reduce((a, c) => a + c.carbs || 0, 0)
    }
    get fat(): number {
        return this.items.reduce((a, c) => a + c.fat || 0, 0)
    }
    get protein(): number {
        return this.items.reduce((a, c) => a + c.protein || 0, 0)
    }
}