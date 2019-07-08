import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Database, IDay, IMeal, ITime, Meal, MealItem, MealName } from './database';


export { ActivityLevel, Day, IDay, IFoodDesc, IFoodDetail,
     IFoodGroup, INutrient, INutritionData, INutritionDefinition,
     IUser, IWeightInfo, Meal, MealItem, MealName,
} from './database';

@Injectable({
    providedIn: 'root',
})
export class Data extends Database {

    constructor() {
        super(1);
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

    async getMeal(id: string): Promise<Meal> {
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
        const items = await this.mealItems.where('mealId').equals(dbMeal.id).toArray();
        const mealItems = items.map(i => new MealItem(i.name, i.calories, i.carbs, i.protein, i.fat, i.mealId, i.id));
        return new Meal(dbMeal.name as MealName, dbMeal.time, mealItems, dbMeal.dayId, dbMeal.id);
    }

    async updateMeal(id: string, date: moment.Moment, name: MealName, items: MealItem[]) {
        console.log('updateMeal', id, date.toLocaleString(), name, items);
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
        };
        await this.meals.put(iMeal);
        const itemIds = items.map(i => i.id).filter(id => id);
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
}
