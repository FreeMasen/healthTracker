import { Injectable } from '@angular/core';
import { Database, IFoodDesc, IFoodDetail, IUser, IMeal, Day, MealItem, Meal, MealName, ITime, IDay} from './database';
import * as moment from 'moment';

export { IFoodDesc, IFoodDetail, IDay, 
        IFoodGroup, INutrient, 
        INutritionData, INutritionDefinition, IUser, 
        IWeightInfo, ActivityLevel, Day,
        Meal, MealName, MealItem

} from './database';


@Injectable({
    providedIn: 'root',
})
export class Data extends Database {
    constructor() {
        super();
        (window as any).db = this;
    }
    /**
     * Get the list of table names required for seeding
     */
    seedTableNames() {
        return [
            'foods',
            'weights',
        ];
    }

    async getMeal(id: number): Promise<Meal> {
        console.log('getMeal', id);
        let dbMeal: IMeal;
        try {
            dbMeal = await this.meals.get(id);
        } catch (e) {
            console.error('error getting dbMeal', id, e);
        }
        console.log('dbMeal', dbMeal);
        if (!dbMeal) {
            throw new Error('No meal found');
        }
        let items = await this.mealItems.where('mealId').equals(dbMeal.id).toArray();
        let mealItems = items.map(i => new MealItem(i.name, i.calories, i.carbs, i.protein, i.fat, i.mealId, i.id));
        return new Meal(dbMeal.name as MealName, dbMeal.time, mealItems, dbMeal.dayId, dbMeal.id);
    }

    async updateMeal(id: number, date: moment.Moment, name: MealName, items: MealItem[]) {
        console.log('updateMeal', id, date.toLocaleString(), name, items);
        let dayDate = date.clone();
        dayDate.startOf('day');
        let day: IDay;
        try {
            day = await this.days.where('date').equals(+dayDate).first();
        } catch (e) {
            console.error('Failed to get day from date', dayDate.toLocaleString());
        }
        let dayId: number;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: +dayDate,
                })
            } catch (e) {
                return console.error('Failed to insert non-existent day', dayDate.toLocaleString());
            }
        } else {
            dayId = day.id;
        }
        let time: ITime = {
            hours: date.hours(),
            minutes: date.minutes(),
        };
        let iMeal = {
            id,
            dayId,
            name,
            time,
        };
        await this.meals.put(iMeal);
        let itemIds = items.map(i => i.id).filter(id => id);
        let toBeDeleted = await this.mealItems.where('mealId').equals(id).and(item => itemIds.indexOf(item.id) < 0).primaryKeys();
        await this.mealItems.bulkDelete(toBeDeleted);
        await this.mealItems.bulkPut(items.map(item => {
            item.mealId = id;
            return item;
        }));
    }

    async addMeal(date: moment.Moment, name: string, contents: MealItem[]) {
        let dayDate = date.clone().startOf('day');
        let day: IDay;
        try {
            day = await this.days.where('date').equals(+dayDate).first();
        } catch (e) {
            console.error('Failed to get day from date', dayDate.toLocaleString());
        }
        let dayId: number;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: +dayDate,
                })

            } catch (e) {
                return console.error('Failed to insert non-existent day', dayDate.toLocaleString());
            }
        } else {
            dayId = day.id;
        }
        let time: ITime = {
            hours: date.hours(),
            minutes: date.minutes(),
        }
        let mealId: number;
        let iMeal = {
            dayId,
            name,
            time,
        };
        try {
            mealId = await this.meals.put(iMeal);
        } catch (e) {
            return console.error('Failed to insert new meal', iMeal);
        }
        for (let item of contents) {
            item.mealId = mealId;
            try {
                await this.mealItems.put(item);
            } catch (e) {
                return console.error('failed to insert mealItem', item);
            }
        }
    }
}