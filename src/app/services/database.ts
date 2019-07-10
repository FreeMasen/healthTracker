import { EventEmitter } from '@angular/core';
import Dexie from 'dexie';
import * as moment from 'moment';
import { IDropboxChanges, IDropboxInfo } from './sync';
const DAY_FORMAT = 'YYYY/MM/DD';

export const ENERGY_ID = 208;
export const CARBS_ID = 205;
export const SUGAR_ID = 269;
export const FIBER_ID = 291;
export const PROTEIN_ID = 203;
export const FAT_ID = 204;
export const JOULES_ID = 268;

export interface IFoodDesc {
    id: number;
    desc: string;
    manufacturer?: string;
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
}

export interface IFoodGroup {
    id: number;
    desc: string;
}

export interface INutritionData {
    id: number;
    foodDesId: number;
    nutId: number;
    val: number;
    refFoodId: number;
    addModDate: moment.Moment;
}

export interface INutritionDefinition {
    nutId: number;
    units: string;
    tagName: string;
    desc: string;
    numDec: number;
    srOrder: number;
    parent?: number;
}

export interface IWeightInfo {
    id?: number;
    foodDescId: number;
    seq: number;
    amount: number;
    measurementDesc: string;
    grams: number;
}

export interface IUser {
    id?: string;
    bodyFatPercentage: number;
    weight: number;
    height: number;
    activityLevel: string;
    age: number;
    weightTarget: number;
    updated?: moment.Moment | number;
    deleted: boolean;
}

export interface IDay {
    id?: string;
    date: number;
    deleted: boolean;
}

export interface IArchiveDay {
    id: string;
    date: number;
    meals: IArchivedMeal[];
    deleted: boolean;
}

export interface IArchivedMeal {
    id: string;
    time: ITime;
    dayId: string;
    name: string;
    deleted: boolean;
    items: MealItem[];
}

export interface IMeal {
    id?: string;
    time: ITime;
    dayId: string;
    name: string;
    deleted: boolean;
}

export interface INutrient {
    data: INutritionData;
    def: INutritionDefinition;
}

export interface IFoodDetail {
    foodDesc: IFoodDesc;
    energy: IEnergy;
    nutrients: INutrient[];
    weights: IWeightInfo[];
}

export interface IEnergy {
    calories: number;
    joules: number;
    fat: INutrient;
    carbs: ICarbs;
    protein: INutrient;
}

export interface ICarbs {
    grams: number;
    sugars: INutrient;
}

export interface IFat {
    grams: number;
    subFats: INutrient[];
}

export interface ISeedInfo {
    id?: number;
    when: string;
    state: 'start' | 'complete';
}

export enum ActivityLevel {
    Active = 'Active',
    SomewhatActive = 'Somewhat Active',
    Sedentary = 'Sedentary',
}

export enum MealName {
    Breakfast = 'Breakfast',
    Lunch = 'Lunch',
    Dinner = 'Dinner',
    Tea = 'Tea',
    Snack = 'Snack',
}

export interface IArchive {
    mealHistory: IArchiveDay[];
    bodyHistory: IUser[];
}

export class Day {
    public date: moment.Moment;
    constructor(
        date: moment.Moment | number,
        public meals: Meal[],
        public id?: string,
    ) {
        if (typeof date === 'number') {
            this.date = moment(date);
        } else {
            this.date = date;
        }
    }

    calories(): number {
        return this.meals.reduce((acc, meal) => acc + meal.calories(), 0);
    }

    carbs(): number {
        return this.meals.reduce((a, m) => a + m.carbs(), 0);
    }

    fat(): number {
        return this.meals.reduce((a, m) => a + m.fat(), 0);
    }

    protein(): number {
        return this.meals.reduce((a, m) => a + m.protein(), 0);
    }

    toJson(): any {
        const ret: any = {
            date: +this.date,
            meals: this.meals,
        };
        if (this.id) {
            ret.id = this.id;
        }
        return ret;
    }
}

export interface ITime {
    hours: number;
    minutes: number;
}

export class Meal {
    constructor(
        public name: MealName,
        public time: ITime,
        public contents: MealItem[],
        public dayId?: string,
        public id?: string,
    ) { }

    calories(): number {
        return this.contents.reduce((a, c) => a + c.calories, 0);
    }

    carbs(): number {
        return this.contents.reduce((a, c) => a + c.carbs || 0, 0);
    }

    fat(): number {
        return this.contents.reduce((a, c) => a + c.fat || 0, 0);
    }

    protein(): number {
        return this.contents.reduce((a, c) => a + c.protein || 0, 0);
    }

    formattedTime() {
        let hours: number;
        let suffix: string;
        if (this.time.hours > 12) {
            hours = this.time.hours - 12;
            suffix = 'p';
        } else {
            hours = this.time.hours;
            suffix = 'a';
        }
        const minutes = `0${this.time.minutes}`.substr(-2);
        return `${hours}:${minutes} ${suffix}`;
    }
    formattedName(short: boolean): string {
        switch (this.name) {
            case MealName.Breakfast:
                return short ? 'B' : this.name;
            case MealName.Lunch:
                return short ? 'L' : this.name;
            case MealName.Dinner:
                return short ? 'D' : this.name;
            case MealName.Snack:
                return short ? 'S' : this.name;
            case MealName.Tea:
                return short ? 'T' : this.name;
            default:
                return short ? '?' : 'Unknown';
        }
    }
}


export class MealItem {
    public id?: string;
    constructor(
        public name: string,
        public calories: number,
        public carbs?: number,
        public protein?: number,
        public fat?: number,
        public mealId?: string,
        id?: string,
    ) {
        if (id) {
            this.id = id;
        }
    }
}
interface IDbDropboxChanges {
    id?: string;
    timestamp: number;
    fileHash: string;
}
export class Database extends Dexie {
    public syncableChanges = new EventEmitter<void>();
    public renderableChanges = new EventEmitter<void>();

    public foods: Dexie.Table<IFoodDesc, number>;
    public weights: Dexie.Table<IWeightInfo, number>;
    public seeds: Dexie.Table<{id?: number, when: string, state: string}, number>;
    public users: Dexie.Table<IUser, string>;
    public days: Dexie.Table<IDay, string>;
    public meals: Dexie.Table<IMeal, string>;
    public mealItems: Dexie.Table<MealItem, string>;
    public dropboxInfo: Dexie.Table<IDropboxInfo, string>;
    public dropboxHash: Dexie.Table<IDbDropboxChanges, string>;

    constructor(vers: number) {
        super('nutrition-data');
        this.version(1).stores({
            foods: '++id,desc,manufacturer',
            weights: 'id,foodDescId,measurementDesc',
            seeds: '++id,when,state',
            users: '$$id,updated',
            days: '$$id,date',
            meals: '$$id,dayId,name,time',
            mealItems: '$$id,name,mealId',
            dropboxInfo: '$$id',
            dropboxHash: '$$id,timestamp'
        });
    }
    /**
     * Check if this database instance has been seeded
     */
    async hasBeenSeeded() {
        return (await this.seeds.count()) >= 1;
    }
    /**
     * Check if the database is ready to be searched
     */
    async isReady() {
        const lastUpdate = await this.seeds.orderBy('id').last();
        return lastUpdate.state === 'complete';
    }
    /**
     * Add a new user to the database
     * @param user The user information to add
     */
    async addUser(info: IUser) {
        if (info.id) {
            delete info.id;
        }
        if (!info.updated) {
            info.updated = +moment(); // unix ms timestamp
        }
        if (typeof info.updated !== 'number') {
            info.updated = +info.updated; // unix ms timestamp
        }
        await this.users.add(info);
        this.renderableChanges.emit();
    }
    async updateUser(user: IUser) {
        const existing = await this.users.get(user.id);
        existing.deleted = true;
        delete user.id;
        if (!user.updated) {
            user.updated = +moment(); // unix ms timestamp
        }
        if (typeof user.updated !== 'number') {
            user.updated = +user.updated; // unix ms timestamp
        }

        await this.users.put(existing);
        await this.users.add(user);
    }
    /**
     * Get the last entry for the user's history
     */
    async getLatestUser(): Promise<IUser> {
        return await this.users.orderBy('id').last();
    }
    /**
     * Get the last 50 user history entries
     */
    async getUserHistory(): Promise<IUser[]> {
        const fromDb = await this.users
            .orderBy('updated')
            .reverse()
            .limit(50)
            .and(b => !b.deleted)
            .toArray();
        return fromDb.map(u => {
            if (u.updated) {
                u.updated = moment(u.updated);
            }
            return u;
        });
    }
    /**
     * Remove a single history entry
     * @param id The ID of the entry to be removed
     */
    async removeUserEntry(id: string) {
        const fromDb = await this.users.get(id);
        fromDb.deleted = true;
        await this.users.put(fromDb);
        this.syncableChanges.emit();
    }

    async removeMeal(id: string) {
        const fromDb = await this.meals.get(id);
        fromDb.deleted = true;
        await this.meals.put(fromDb);
        this.syncableChanges.emit();
    }
    /**
     * Get today's consumed information
     */
    async getTodaysEntries() {
        return this.getMealsForDay(moment());
    }
    /**
     * Get the stored meals for the date
     * @param day The date to get from the db
     */
    async getMealsForDay(date: moment.Moment) {
        const dt = +date.startOf('day');
        let day = await this.days.where('date').equals(dt).first();
        if (!day) {
            day = {
                date: dt,
                deleted: false,
            };
            const id = await this.days.put(day);
            return new Day(date, [], id);
        }
        return this.fillDay(day);
    }

    private async fillDay(day: IDay): Promise<Day> {
        const dbMeals = await this.meals.where('dayId').equals(day.id).and(d => !d.deleted).toArray();
        console.log('dbMeals', dbMeals);

        const ret = new Day(day.date, new Array(dbMeals.length), day.id);
        for (let i = 0; i < dbMeals.length; i++) {
            const dbMeal = dbMeals[i];
            const dbContents = await this.mealItems
                                    .where('mealId')
                                    .equals(dbMeal.id)
                                    .toArray();
            const contents = dbContents.map(
                dbItem =>
                    new MealItem(
                        dbItem.name,
                        dbItem.calories,
                        dbItem.carbs,
                        dbItem.protein,
                        dbItem.fat,
                        dbItem.mealId,
                        dbItem.id
                    )
                );
            ret.meals[i] = new Meal(dbMeal.name as MealName, dbMeal.time, contents, day.id, dbMeal.id);
        }
        return ret;
    }


    /**
     * Find a food by name
     * @param term The name to search
     */
    async findFood(term: string): Promise<MealItem[]> {
        const foods = await this.mealItems
                        .where('name')
                        .startsWithIgnoreCase(term)
                        .distinct()
                        .sortBy('name');
        return foods.map(f => new MealItem(f.name, f.calories, f.carbs, f.protein, f.fat, null, f.id));
    }
    /**
     * Get the details for a food from the search
     * @param foodDesId The ID of the food details to get
     */
    async foodDetails(foodDesId: number): Promise<IFoodDesc> {
        return await this.foods.get(foodDesId);
    }

    async seed(updateCb: (event: string, tableName: string, target: number, updatedValue: number) => void): Promise<void> {
        try {
            if (await this.seeds.count() > 0) {
                this.seeds.clear();
            }
            await this.seeds.add({when: moment().toISOString(), state: 'start'});
            await this.seedTable(this.foods, 'food_details.json', updateCb);
            await this.seedTable(this.weights, 'weight.json', updateCb);
            await this.seeds.add({when: moment().toISOString(), state: 'complete'});

        } catch (e) {
            console.error('Error seeding', e);
        }

    }

    async seedTable<T, K>(
        table: Dexie.Table<T, K>,
        route: string,
        updateCb: (event: string, tableName: string,
                   target: number, updatedValue: number) => void
        ): Promise<void> {
        let seedData;
        updateCb('fetching', table.name, 100, 0);
        try {
            seedData = await fetch(route).then(res => res.json());
        } catch (e) {
            console.error('Failed to get seed data for', table.name, 'at route', route, e);
            throw e;
        }
        updateCb('clearing', table.name, 100, 0);
        try {
            await table.clear();
        } catch (e) {
            console.error('Failed to clear ', table.name, e);
            throw e;
        }
        updateCb('starting-seed', table.name, 100, 0);
        try {
            await this.batchSeed(table, seedData, updateCb);
        } catch (e) {
            console.error('failed to add data to ', table.name, seedData);
        }
    }

    private async batchSeed<T, K>(
        table: Dexie.Table<T, K>,
        batch: any[],
        updateCb: (event: string, tableName: string,
                   target: number, updatedValue: number) => void
        ): Promise<void> {
        let start = 0;
        updateCb('seeding', table.name, batch.length, start);
        while (start < batch.length - 1) {
            const len = Math.min(10000, batch.length - start);
            const slice = batch.slice(start, start + len);
            start += len;
            try {
                await table.bulkAdd(slice);
                updateCb('seeding', table.name, batch.length, start);
            } catch (e) {
                console.error('bailing after error for', table.name, e);
                break;
            }
        }
        updateCb('complete', table.name, batch.length, batch.length);
    }

    async getAllUserData(): Promise<IArchive> {
        const dbDays = await this.days.toArray();
        let mealHistory = [];
        for (let day of dbDays) {
            let dbMeals = await this.meals.where('dayId').equals(day.id).toArray();
            let meals = [];
            for (let meal of dbMeals) {
                let items = await this.mealItems.where('mealId').equals(meal.id).toArray();
                meals.push({
                    id: meal.id,
                    time: meal.time,
                    dayId: day.id,
                    name: meal.name,
                    deleted: meal.deleted,
                    items,
                });
            }
            mealHistory.push({
                id: day.id,
                date: day.date,
                meals,
                deleted: day.deleted,
            });
        }
        let bodyHistory = await this.users.toArray();
        return {
            mealHistory,
            bodyHistory,
        };
    }

    async importArchive(archive: IArchive, syncable: boolean = true) {
        console.log('importArchive', archive, syncable);
        const result = {
            days: 0,
            meals: 0,
            items: 0,
            body: 0,
        };
        for (const day of archive.mealHistory) {
            const existingDay = await this.days.where('date').equals(day.date).first();
            console.log('day vs existing', day, existingDay);
            if (!existingDay) {
                // day is unknown, add a new day
                await this.days.put({
                    id: day.id,
                    date: day.date,
                    deleted: day.deleted
                });
                result.days++;
            } else {
                // We already have that day but let's just overwrite the ID to that of
                // the archive
                let meals = await this.meals.where('dayId').equals(existingDay.id).toArray();
                for (let meal of meals) {
                    let updatedMeal = Object.assign({}, meal, {dayId: day.id});
                    await this.meals.put(updatedMeal);
                }
                await this.days.delete(existingDay.id);
                await this.days.put(day);
            }
            for (const meal of day.meals) {
                const existingMeal = await this.meals.where('id')
                    .equals(meal.id)
                    .first();
                console.log('meal vs existing', meal, existingMeal);
                if (!existingMeal || !this.checkMeals(existingMeal, meal)) {
                    const toInsert = {
                        id: meal.id,
                        time: meal.time,
                        dayId: day.id,
                        name: meal.name,
                        deleted: meal.deleted
                    };
                    await this.meals.put(toInsert);
                    result.meals++;
                } else {

                }
                for (const item of meal.items) {
                    const existingItem = await this.mealItems
                        .where('id')
                        .equals(item.id)
                        .first();
                    console.log('item vs existing', item, existingItem);
                    if (!existingItem) {
                        const i = Object.assign({}, item);
                        i.mealId = meal.id;
                        await this.mealItems.put(i);
                        result.items++;
                    }
                }
            }
        }
        for (const body of archive.bodyHistory) {
            const existingBody = await this.users.where('id').equals(body.id).first();
            console.log('body vs existing', body, existingBody);
            if (!existingBody || !this.checkBodies(body, existingBody)) {
                await this.users.put(body);
                result.body++;
            }
        }
        if (syncable) {
            this.syncableChanges.emit();
        }
        this.renderableChanges.emit();
        return result;
    }
    private checkMeals(lhs: IMeal, rhs: IArchivedMeal): boolean {
        return lhs
            && rhs
            && lhs.name === rhs.name
            && lhs.time.hours === rhs.time.hours
            && lhs.time.minutes === rhs.time.minutes
            && lhs.deleted === rhs.deleted
    }
    private checkBodies(lhs: IUser, rhs: IUser): boolean {
        return lhs 
            && rhs 
            && lhs.activityLevel === rhs.activityLevel
            && lhs.age === rhs.age
            && lhs.bodyFatPercentage === rhs.bodyFatPercentage
            && lhs.deleted === rhs.deleted
            && lhs.height === rhs.height
            && lhs.weight === rhs.weight
            && lhs.weightTarget === rhs.weightTarget
    }

    public async addDropBoxInfo(info: IDropboxInfo) {
        await this.dropboxInfo.add(info);
    }

    public async getDropBoxInfo(): Promise<IDropboxInfo> {
        return this.dropboxInfo.limit(1).first();
    }
    public async getLastDropboxHash(): Promise<string> {
        const record = await this.dropboxHash.orderBy('timestamp').reverse().limit(1).first();
        if (!record) {
            return null;
        }
        return record.fileHash;
    }
    public async saveDropboxChanges(changes: IDropboxChanges) {
        await this.dropboxHash.add({
            fileHash: changes.fileHash,
            timestamp: +moment(changes.fileModified),
        });
    }
}
