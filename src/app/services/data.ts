import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Database, IDay, IMeal, ITime, IWeightSet, Meal, MealItem, MealName } from './database';


export enum WorkoutKind {
    Legs = 'Legs',
    Back = 'Back',
    Chest = 'Chest',
    Shoulders = 'Shoulders',
    Core = 'Core',
    Arms = 'Arms',
}

export interface IWorkoutShape {
    kind: WorkoutKind;
    allowFluff: boolean;
}

export interface IExercise {
    name: string;
    kind: WorkoutKind;
    fluff: boolean;
}

export class Exercise {
    constructor(
        public name: string,
        public kind: WorkoutKind,
        public reps: number,
        public fluff: boolean = false,
    ) {}
}

export class ExerciseSet {
    private count = 0;
    constructor(
        public first?: Exercise,
        public second?: Exercise,
        public third?: Exercise,
    ) {
        if (!!first) {
            this.count++;
        }
        if (!!second) {
            this.count++;
        }
        if (!!third) {
            this.count++;
        }
    }

    public add(ex: Exercise) {
        switch (this.count) {
            case 0:
                this.first = ex;
                break;
            case 1:
                this.second = ex;
                break;
            case 2:
                this.third = ex;
                break;
            default:
                return;
        }
        this.count++;
    }
}

export class Workout {
    constructor(
        public sets: ExerciseSet[],
    ) {}
}

export {
    ActivityLevel,
    Day,
    IDay,
    IFoodDesc,
    IFoodDetail,
    IFoodGroup,
    INutrient,
    INutritionData,
    INutritionDefinition,
    IUser,
    IWeightInfo,
    Meal,
    MealItem,
    MealName
} from './database';

@Injectable({
    providedIn: 'root',
})
export class Data extends Database {

    constructor() {
        super();
        (window as any).db = this;
        if (!moment) {
            throw new Error('invalid setup, moment isn\'t getting loaded');
        }
    }
    /**
     * Get the list of table names required for seeding
     */
    seedTableNames() {
        return [
            'foods',
            'weights',
            'knownMealItems'
        ];
    }

    async getMeal(id: string): Promise<Meal> {
        let dbMeal: IMeal;
        try {
            dbMeal = await this.meals.get(id);
        } catch (e) {
            console.error('error getting dbMeal', id, e);
        }
        if (!dbMeal) {
            throw new Error('No meal found');
        }
        const items = await this.mealItems.where('mealId').equals(dbMeal.id).toArray();
        const mealItems = items.map(i => new MealItem(
            i.name,
            i.calories,
            i.carbs,
            i.protein,
            i.fat,
            i.mealId, 
            i.id
        ));
        return new Meal(dbMeal.name as MealName, dbMeal.time, mealItems, dbMeal.dayId, dbMeal.id);
    }

    async updateMeal(id: string, date: moment.Moment, name: MealName, items: MealItem[], deleted: boolean = false) {
        const dayDate = date.clone();
        dayDate.startOf('day');
        let day: IDay;
        try {
            day = await this.days.where('date').equals(+dayDate).first();
        } catch (e) {
            console.error('Failed to get day from date', dayDate.toLocaleString());
        }
        let dayId: string;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: +dayDate,
                    deleted: false,
                });
            } catch (e) {
                return console.error('Failed to insert non-existent day', dayDate.toLocaleString());
            }
        } else {
            dayId = day.id;
        }
        const time: ITime = {
            hours: date.hours(),
            minutes: date.minutes(),
        };
        const iMeal = {
            id,
            dayId,
            name,
            time,
            deleted,
        };
        await this.meals.put(iMeal);
        const itemIds = items.map(i => i.id).filter(i => i);
        const toBeDeleted = await this.mealItems.where('mealId').equals(id).and(item => itemIds.indexOf(item.id) < 0).primaryKeys();
        await this.mealItems.bulkDelete(toBeDeleted);
        await this.mealItems.bulkPut(items.map(item => {
            item.mealId = id;
            return item;
        }));
        this.renderableChanges.emit();
        this.syncableChanges.emit();
    }

    async addMeal(date: moment.Moment, name: string, contents: MealItem[]) {
        const dayDate = date.clone().startOf('day');
        let day: IDay;
        try {
            day = await this.days.where('date').equals(+dayDate).first();
        } catch (e) {
            console.error('Failed to get day from date', dayDate.toLocaleString());
        }
        let dayId: string;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: +dayDate,
                    deleted: false,
                });

            } catch (e) {
                return console.error('Failed to insert non-existent day', dayDate.toLocaleString());
            }
        } else {
            dayId = day.id;
        }
        const time: ITime = {
            hours: date.hours(),
            minutes: date.minutes(),
        };
        let mealId: string;
        const iMeal = {
            dayId,
            name,
            time,
            deleted: false,
        };
        try {
            mealId = await this.meals.put(iMeal);
        } catch (e) {
            return console.error('Failed to insert new meal', iMeal);
        }
        for (const item of contents) {
            item.mealId = mealId;
            try {
                await this.mealItems.put(item);
            } catch (e) {
                return console.error('failed to insert mealItem', item);
            }
        }
        this.renderableChanges.emit();
        this.syncableChanges.emit();
    }
    public async getRecentWeightSets(): Promise<[IWeightSet, number][]> {
        let days: {[key: number]: {[key: string]: [IWeightSet, number]}} = {};
        for (let i = 0; true; i++) {
            const batch = await this.weightSets
                .orderBy('when')
                .reverse()
                .limit(50)
                .offset(i * 50)
                .toArray();
            if (batch.length === 0) {
                break;
            }
            for (const set of batch) {
                if (typeof set.when === 'number') {
                    set.when = moment(set.when)
                        .hour(0)
                        .minute(0)
                        .second(0)
                        .millisecond(0);
                }
                if (!days[+set.when]) {
                    days[+set.when] = {};
                }
                if (!days[+set.when][set.name]) {
                    days[+set.when][set.name] = [set, 1];
                } else {
                    days[+set.when][set.name][1]++;
                }
            }
        }
        const ret = [];
        const dates = Object.getOwnPropertyNames(days);
        dates.sort();
        for (const dayKey of dates) {
            const day = days[dayKey];
            for (const weightKey of Object.getOwnPropertyNames(day)) {
                ret.push(day[weightKey]);
            }
        }
        return ret;
    }
    public async getWeightSet(id: string): Promise<IWeightSet> {
        const ret = await this.weightSets.get(id);
        if (typeof ret.when === 'number') {
            ret.when = moment(ret.when);
        }
        return ret;
    }
    public async addWeightSet(set: IWeightSet) {
        set.when = +set.when;
        set.id = await this.weightSets.add(set);
        this.renderableChanges.emit();
        this.syncableChanges.emit();
        return set;
    }
    public async addWeightSets(sets: IWeightSet[]) {
        sets = sets.map(s => {
            s.when = +s.when;
            return s;
        });
        await this.weightSets
            .bulkAdd(sets);
    }

    public async updateWeightSet(set: IWeightSet) {
        if (typeof set.when !== 'number') {
            set.when = +set.when;
        }
        await this.weightSets.put(set, set.id);
        this.renderableChanges.emit();
        this.syncableChanges.emit();
    }
    public async deleteWeightSet(id: string) {
        await this.weightSets.delete(id);
        this.renderableChanges.emit();
        this.syncableChanges.emit();
    }
    public async getLastWeight(): Promise<number> {
        return (await this.users
            .orderBy('updated')
            .reverse()
            .limit(50)
            .and(b => !b.deleted)
            .first())
            .weight;
    }

    public async searchDistinctExerciseNames(name: string): Promise<string[]> {
        const records = await this.weightSets
                .where('name')
                .startsWithIgnoreCase(name)
                .toArray();
        const names = records.reduce(this.searchReducer, new Set());
        return Array.from(names);
    }

    private searchReducer(acc: Set<string>, ws: IWeightSet): Set<string> {
        acc.add(ws.name);
        return acc;
    }

    public async mostRecentFor(name: string): Promise<IWeightSet> {
        return await this.weightSets
            .orderBy('when')
            .filter(ws => ws.name === name)
            .reverse()
            .first();
    }

    public getAllWorkoutOptions(): Promise<IExercise[]> {
        return Promise.resolve([
            {name: 'Deadlifts', kind: WorkoutKind.Legs, fluff: false},
            {name: 'Back Squats', kind: WorkoutKind.Legs, fluff: false},
            {name: 'Lunges', kind: WorkoutKind.Legs, fluff: false},
            {name: 'Bulgarians', kind: WorkoutKind.Legs, fluff: false},
            {name: 'Chest Press', kind: WorkoutKind.Chest, fluff: false},
            {name: 'Peck Flys', kind: WorkoutKind.Chest, fluff: false},
            {name: 'Overhead Press', kind: WorkoutKind.Shoulders, fluff: false},
            {name: 'Lat Raises', kind: WorkoutKind.Shoulders, fluff: false},
            {name: 'Pull Downs', kind: WorkoutKind.Back, fluff: false},
            {name: 'Hammer Curls', kind: WorkoutKind.Arms, fluff: true},
            {name: 'Skull Crushers', kind: WorkoutKind.Arms, fluff: true},
            {name: 'Tricep Pull Down', kind: WorkoutKind.Arms, fluff: true},
            {name: 'Arnold Press', kind: WorkoutKind.Shoulders, fluff: false},
            {name: 'Push Ups', kind: WorkoutKind.Chest, fluff: false},
            {name: 'Leg Raises', kind: WorkoutKind.Core, fluff: false},
            {name: 'Glute Bridges', kind: WorkoutKind.Core, fluff: false},
            {name: 'Penguin Crunches', kind: WorkoutKind.Core, fluff: true},
            {name: 'Plank', kind: WorkoutKind.Core, fluff: false},
            {name: 'Calve Raises', kind: WorkoutKind.Legs, fluff: true},
        ]);
    }
}
