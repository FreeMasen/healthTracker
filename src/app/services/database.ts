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
    foodGroupId: number;
    desc: string;
    shortDesc: string;
    commonName?: string;
    manufacturer?: string;
    refuseDesc?: string;
    refuseWeight: number;
    nitroToProFact: number;
    calFromProFact: number;
    calFromFatFact: number;
    calFromCarFact: number;
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
    updated?: moment.Moment | string;
}

export interface IDay {
    id?: number;
    date: string;
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

export class Day {
    public date: moment.Moment;
    constructor(
        date: moment.Moment | string,
        public meals: Meal[],
        public id?: number,
    ) {
        if (typeof date === 'string') {
            this.date = moment(date, DAY_FORMAT);
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
            date: this.date.format('YYYY/MM/DD')
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
    public foodGroups: Dexie.Table<IFoodGroup, number>;
    public nutrition: Dexie.Table<INutritionData, number>;
    public nutritionDefs: Dexie.Table<INutritionDefinition, number>;
    public weights: Dexie.Table<IWeightInfo, number>;
    public seeds: Dexie.Table<{id?: number, when: string, state: string}, number>;
    public users: Dexie.Table<IUser, number>;
    public days: Dexie.Table<IDay, number>;
    public meals: Dexie.Table<IMeal, number>;
    public mealItems: Dexie.Table<MealItem, number>
    constructor() {
        super('nutrition-data');
        this.version(1).stores({
            foods: '++id,desc,shortDesc,commonName,manufacturer',
            foodGroups: '++id,desc',
            nutrition: 'id,nutId,foodDesId',
            nutritionDefs: '++nutId,tagName,desc',
            weights: 'id,foodDescId,measurementDesc',
            seeds: '++id,when,state',
            users: '++id',
            days: '++id,date',
            meals: '++id,dayId,name,time',
            mealItems: '++id,name,mealId',
        });
    }

    async hasBeenSeeded() {
        return (await this.seeds.count()) >= 2;
    }
    
    async isReady() {
        
        let lastUpdate = await this.seeds.orderBy('id').last();
        return lastUpdate.state === 'complete';
    }
    async addUserInfo(info: IUser) {
        if (info.id) {
            delete info.id;
        }
        if (!info.updated) {
            info.updated = moment().toISOString();
        }
        if (typeof info.updated != 'string') {
            info.updated = info.updated.toISOString();
        }
        await this.users.put(info);
    }

    async getLatestUser(): Promise<IUser> {
        return await this.users.orderBy('id').last()
    }

    async getUserHistory(): Promise<IUser[]> {
        return (await this.users.orderBy('id').reverse().limit(50).toArray()).map(u => {
            if (u.updated) {
                u.updated = moment(u.updated);
            }
            return u;
        });
    }

    async removeUserHistory(id: number) {
        await this.users.delete(id)
    }

    async removeMeal(id: number) {
        await this.meals.delete(id);
        await this.mealItems.where('mealId').equals(id).delete();
    }

    async getTodaysEntries() {
        return this.getMealsFor(moment())
    }

    async getMealsFor(date: moment.Moment) {
        let dt = date.format(DAY_FORMAT);
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
        let day: IDay;
        try {
            day = await this.days.where('date').equals(date.format(DAY_FORMAT)).first();
        } catch (e) {
            console.error('Failed to get day from date', date.format(DAY_FORMAT))
        }
        let dayId: number;
        if (!day) {
            try {
                dayId = await this.days.put({
                    date: date.format(DAY_FORMAT),
                })

            } catch (e) {
                return console.error('Failed to insert non-existent day', date.format(DAY_FORMAT));
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

    async findFood(term: string): Promise<IFoodDesc[]> {
        return await this.foods.where('desc')
                        .startsWithIgnoreCase(term)
                        .or('shortDesc')
                        .startsWithIgnoreCase(term)
                        .or('commonName')
                        .startsWithIgnoreCase(term)
                        .or('manufacturer')
                        .startsWithIgnoreCase(term)
                        .toArray()
    }

    async foodDetails(foodDesId: number): Promise<IFoodDetail> {
        let foodDesc = await this.foods.get(foodDesId);
        let nuts: INutritionData[]  = await this.nutrition.where('foodDesId').equals(foodDesId).toArray();
        let nutrients: INutrient[] = new Array(nuts.length - 5);
        let energy: IEnergy = {
            calories: 0,
            carbs: {
                grams: 0,
                sugars: {
                    data: {nutId: SUGAR_ID, val: 0, addModDate: moment(), foodDesId, id: -1, refFoodId: -1},
                    def: {desc: 'Sugar', nutId: SUGAR_ID, units: 'g', numDec: -1,srOrder: -1,tagName: 'SUGAR'},
                },
            },
            fat: null,
            joules: 0,
            protein: null
        };
        for (let i = 0; i < nuts.length; i++) {
            let data = nuts[i];
            let def = await this.nutritionDefs.get(data.nutId);
            if (!data || !def) continue;
            if (def.nutId === ENERGY_ID) {
                energy.calories = data.val;
            } else if (def.nutId === CARBS_ID) {
                energy.carbs.grams = data.val;
            } else if (def.nutId === FAT_ID) {
                energy.fat = {data, def};
            } else if (def.nutId === PROTEIN_ID) {
                energy.protein = {data, def};
            } else if (def.nutId === JOULES_ID) {
                energy.joules = data.val;
            }
            nutrients[i] = {
                data,
                def,
            }
        }
        nutrients = nutrients.filter(n => n.data && n.def);
        
        let weights = await this.weights.where('foodDescId').equals(foodDesId).toArray();
        return {
            foodDesc,
            nutrients,
            weights,
            energy,
        }
    }

    async seed(updateCb: (event: string, tableName: string, target: number, updatedValue: number) => void): Promise<void> {
        try {
            if (await this.seeds.count() > 0) {
                this.seeds.clear();
            }
            await this.seeds.add({when: moment().toISOString(), state: 'start'})
            await this.seedTable(this.foods, 'food_desc.json', updateCb);
            await this.seedTable(this.foodGroups, 'food_groups.json', updateCb);    
            await this.seedTable(this.nutrition, 'nut_data.json', updateCb);
            await this.seedTable(this.nutritionDefs, 'nutr_def.json', updateCb);
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

    async getAllUserData() {
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
}