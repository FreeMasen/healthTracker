import Dexie from 'dexie';
import * as moment from 'moment';
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
    grams:number;
}

export interface IUser {
    id?: number;
    bodyFatPercentage: number;
    weight: number;
    height: number;
    activityLevel: string;
    age: number;
    weightTarget: number;
    updated?: moment.Moment | number;
}

export interface IDay {
    id?: number;
    date: number;
}

export interface IMeal {
    id?: number;
    time: ITime;
    dayId: number;
    name: string;
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
    subFats: INutrient[]
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
    mealHistory: Day[],
    bodyHistory: IUser[],
}

export class Day {
    public date: moment.Moment;
    constructor(
        date: moment.Moment | number,
        public meals: Meal[],
        public id?: number,
    ) {
        if (typeof date === 'number') {
            this.date = moment(date);
        } else {
            this.date = date;
        }
    }

    calories(): number {
        return this.meals.reduce((acc, meal) => acc + meal.calories(), 0)
    }

    carbs(): number {
        return this.meals.reduce((a, m) => a + m.carbs(), 0)
    }
    
    fat(): number {
        return this.meals.reduce((a, m) => a + m.fat(), 0)
    }

    protein(): number {
        return this.meals.reduce((a, m) => a + m.protein(), 0)
    }

    forDb(): IDay {
        let ret: IDay = {
            date: +this.date
        }
        if (this.id) {
            ret.id = this.id
        };
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
        public dayId?: number,
        public id?: number,
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
        let minutes = `0${this.time.minutes}`.substr(-2);
        return `${hours}:${minutes} ${suffix}`;
    }
    forDb(): IMeal {
        let ret: IMeal = {
            name: this.name,
            time: this.time,
            dayId: this.dayId,
        }
        if (this.id) {
            ret.id = this.id;
        }
        return ret;
    }
}


export class MealItem {
    public id?: number;
    constructor(
        public name: string,
        public calories: number,
        public carbs?: number,
        public protein?: number,
        public fat?: number,
        public mealId?: number,
        id?: number,
    ) { 
        if (id) {
            this.id = id;
        }
    }
}

export class Database extends Dexie {
    public foods: Dexie.Table<IFoodDesc, number>;
    public weights: Dexie.Table<IWeightInfo, number>;
    public seeds: Dexie.Table<{id?: number, when: string, state: string}, number>;
    public users: Dexie.Table<IUser, number>;
    public days: Dexie.Table<IDay, number>;
    public meals: Dexie.Table<IMeal, number>;
    public mealItems: Dexie.Table<MealItem, number>
    constructor() {
        super('nutrition-data');
        this.version(1).stores({
            foods: '++id,desc,manufacturer',
            weights: 'id,foodDescId,measurementDesc',
            seeds: '++id,when,state',
            users: '++id,updated',
            days: '++id,date',
            meals: '++id,dayId,name,time',
            mealItems: '++id,name,mealId',
        });
    }
    /**
     * Check if this database instance has been seeded
     */
    async hasBeenSeeded() {
        return (await this.seeds.count()) >= 2;
    }
    /**
     * Check if the database is ready to be searched
     */
    async isReady() {
        
        let lastUpdate = await this.seeds.orderBy('id').last();
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
            info.updated = +moment(); //unix ms timestamp
        }
        if (typeof info.updated != 'number') {
            info.updated = +info.updated; //unix ms timestamp
        }
        await this.users.put(info);
    }
    /**
     * Get the last entry for the user's history
     */
    async getLatestUser(): Promise<IUser> {
        return await this.users.orderBy('id').last()
    }
    /**
     * Get the last 50 user history entries
     */
    async getUserHistory(): Promise<IUser[]> {
        return (await this.users.orderBy('updated').reverse().limit(50).toArray()).map(u => {
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
    async removeUserEntry(id: number) {
        await this.users.delete(id)
    }

    async removeMeal(id: number) {
        await this.meals.delete(id);
        await this.mealItems.where('mealId').equals(id).delete();
    }
    /**
     * Get today's consumed information
     */
    async getTodaysEntries() {
        return this.getMealsForDay(moment())
    }
    /**
     * Get the stored meals for the date
     * @param day The date to get from the db
     */
    async getMealsForDay(date: moment.Moment) {
        let dt = +date.startOf('day');
        let day = await this.days.where('date').equals(dt).first();
        if (!day) {
            day = {
                date: dt,
            };
            let id = await this.days.put(day);
            return new Day(date, [], id);
        }
        return this.fillDay(day);
    }

    private async fillDay(day: IDay): Promise<Day> {
        let dbMeals = await this.meals.where('dayId').equals(day.id).toArray();
        let ret = new Day(day.date, new Array(dbMeals.length), day.id);
        for (let i = 0; i < dbMeals.length;i++) {
            let dbMeal = dbMeals[i];
            let dbContents = await this.mealItems
                                    .where('mealId')
                                    .equals(dbMeal.id)
                                    .toArray();
            let contents = dbContents.map(dbItem => new MealItem(dbItem.name, dbItem.calories, dbItem.carbs, dbItem.protein, dbItem.fat, dbItem.mealId, dbItem.id));
            ret.meals[i] = new Meal(dbMeal.name as MealName, dbMeal.time, contents, day.id, dbMeal.id);
        }
        return ret;
    }

    async addMeal(date: moment.Moment, name: string, contents: MealItem[]) {
        console.log('Data.addMeal', date.toLocaleString(), name, contents.map(i => i.name).join(','));
        let dayDate = date.clone().startOf('day');
        let day: IDay;
        try {
            day = await this.days.where('date').equals(+dayDate).first();
        } catch (e) {
            console.error('Failed to get day from date', dayDate.format(DAY_FORMAT))
        }
        let dayId: number;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: +dayDate,
                })

            } catch (e) {
                return console.error('Failed to insert non-existent day', dayDate.format(DAY_FORMAT));
            }
        } else {
            dayId = day.id;
        }
        let time: ITime = {
            hours: date.hours(),
            minutes: date.minutes(),
        }
        console.log('time', time, date.toLocaleString());
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
    /**
     * Find a food by name
     * @param term The name to search
     */
    async findFood(term: string): Promise<MealItem[]> {
        let foods = await this.mealItems
                        .where('name')
                        .startsWithIgnoreCase(term)
                        .sortBy('name');
        return foods.map(f => new MealItem(f.name, f.calories, f.carbs, f.protein, f.fat, null, f.id))
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
            await this.seeds.add({when: moment().toISOString(), state: 'start'})
            await this.seedTable(this.foods, 'food_details.json', updateCb);
            await this.seedTable(this.weights, 'weight.json', updateCb);
            await this.seeds.add({when: moment().toISOString(), state: 'complete'});
            
        } catch (e) {
            console.error('Error seeding', e);
        }

    }

    async seedTable<T, K>(table: Dexie.Table<T, K>, route: string, updateCb: (event: string, tableName: string, target: number, updatedValue: number) => void): Promise<void> {
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

    private async batchSeed<T, K>(table: Dexie.Table<T, K>, batch: any[], updateCb: (event: string, tableName: string, target: number, updatedValue: number) => void): Promise<void> {
        let start = 0;
        updateCb('seeding', table.name, batch.length, start);
        while (start < batch.length - 1) {
            let len = Math.min(10000, batch.length - start);
            let slice = batch.slice(start, start + len);
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
        let dbDays = await this.days.toArray();
        let mealHistory = new Array(dbDays.length);
        for (let i = 0;i < dbDays.length;i++) {
            mealHistory[i] = await this.fillDay(dbDays[i]);
        }
        let bodyHistory = await this.users.toArray();
        return {
            mealHistory,
            bodyHistory,
        }
    }

    async importArchive(archive: IArchive) {        
        for (let day of archive.mealHistory) {
            let date = typeof day.date === 'number' ? day.date : +day.date;
            let existingDay = await this.days.where('date').equals(date).first()
            let newDayId: number;
            if (existingDay) {
                newDayId = existingDay.id;
            } else {
                newDayId = await this.days.put({date});
            }
            for (let meal of day.meals) {
                let existingMeal = await this.meals.where('dayId').equals(newDayId).and(m => m.name == meal.name && m.time == meal.time).first();
                let newMealId: number;
                if (existingMeal) {
                    newMealId = existingMeal.id
                } else {
                    newMealId = await this.meals.put({
                        dayId: newDayId,
                        name: meal.name,
                        time: meal.time,
                    });
                }
                for (let item of meal.contents) {
                    let existingItem = await this.mealItems.where('mealId').equals(newMealId).and(i => i.name == item.name).first();
                    if (!existingItem) {
                        let i = Object.assign({}, item);
                        delete i.id;
                        i.mealId = newMealId;
                        await this.mealItems.put(i);
                    }
                }
            }
        }
        for (let body of archive.bodyHistory) {
            let updated = typeof body.updated === 'number' ? body.updated : +moment(body.updated);
            let existingBody = await this.users.where('updated').equals(updated).first();
            if (!existingBody) {
                let newBody = Object.assign({}, body);
                delete newBody.id;
                await this.users.put(newBody)
            }
        }
    }
}