import { Injectable } from '@angular/core';
import { Database, IFoodDesc, IFoodDetail, IUser, Day, MealItem} from './database';
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
export class Data {
    private db = new Database();
    constructor() {

    }
    /**
     * Get the list of table names required for seeding
     */
    seedTableNames() {
        return [
            'foods',
            'foodGroups',
            'nutrition',
            'nutritionDefs',
            'weights',
        ];
    }
    /**
     * Check if this database instance has been seeded
     */
    async hasBeenSeeded() {
        return await this.db.hasBeenSeeded();
    }
    /**
     * Check if the database is ready to be searched
     */
    async isReady() {
        return await this.db.isReady();
    }
    /**
     * Add a new user to the database
     * @param user The user information to add
     */
    async addUser(user: IUser) {
        return await this.db.addUserInfo(user);
    }
    /**
     * Get the last entry for the user's history
     */
    async getLatestUser(): Promise<IUser> {
        return await this.db.getLatestUser();
    }
    /**
     * Remove a single history entry
     * @param id The ID of the entry to be removed
     */
    async removeUserEntry(id: number) {
        this.db.removeUserHistory(id);
    }
    /**
     * Get the last 50 user history entries
     */
    async getUserHistory(): Promise<IUser[]> {
        return await this.db.getUserHistory();
    }
    /**
     * Get today's consumed information
     */
    async getTodaysEntries(): Promise<Day> {
        return await this.db.getTodaysEntries();
    }
    /**
     * Get the stored meals for the date
     * @param day The date to get from the db
     */
    async getMealsForDay(day: moment.Moment): Promise<Day> {
        return this.db.getMealsFor(day);
    }
    /**
     * Find a food by name
     * @param term The name to search
     */
    async findFood(term: string): Promise<IFoodDesc[]> {
        return await this.db.findFood(term);
    }
    /**
     * Get the details for a food from the search
     * @param foodDesId The ID of the food details to get
     */
    async foodDetails(foodDesId: number): Promise<IFoodDetail> {
        return await this.db.foodDetails(foodDesId)
    }

    async addMeal(date: moment.Moment, name: string, contents: MealItem[]) {
        return this.db.addMeal(date, name, contents);
    }

    async removeMeal(id: number) {
        return this.db.removeMeal(id);
    }
}