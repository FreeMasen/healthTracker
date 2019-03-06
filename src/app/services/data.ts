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
export class Data extends Database {
    constructor() {
        super();
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
}