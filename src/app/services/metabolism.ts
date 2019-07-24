import { Injectable } from '@angular/core';
import { IUser, ActivityLevel, MetabolismGender } from './database';
export interface IMetabolismInfo {
    basal: number;
    need: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
}
@Injectable({
    providedIn: 'root',
})
export class MetabolismCalculator {
    constructor(

    ) {}
    getMetabolismInfo(user: IUser, gender: MetabolismGender = MetabolismGender.Male): IMetabolismInfo {
        let basal = 0;
        if (gender === MetabolismGender.Male) {
            basal = this.basalMan(user);
        } else {
            basal = this.basalWoman(user);
        }
        const need = this.bmrToNeed(basal, user.activityLevel as ActivityLevel);
        return {
            basal,
            need,
            proteinTarget: this.proteinTarget(user),
            carbsTarget: this.carbsTarget(need),
            fatTarget: this.fatTarget(need),
        };
    }
    basalMan(user: IUser) {
        return this.basalMan_(
            this.inchesToCm(user.height),
            this.lbToKg(user.weight),
            user.age,
        );
    }
    basalWoman(user: IUser): number {
        return this.basalWoman_(
            this.inchesToCm(user.height),
            this.lbToKg(user.weight),
            user.age,
        );
    }

    private basalMan_(height: number, weight: number, age: number): number {
        return this.basalBase(height, weight, age) + 5;
    }
    private basalWoman_(height: number, weight: number, age: number): number {
        return this.basalBase(height, weight, age) - 161;
    }
    private basalBase(height: number, weight: number, age: number): number {
        return (10 * weight)
             + (6.25 * height)
             - (5 * age);
    }

    private inchesToCm(height: number) {
        return height * 2.54;
    }

    private lbToKg(lb: number): number {
        return lb * 0.454;
    }

    bmrToNeed(bmr: number, activity: ActivityLevel): number {
        let p = 1.2;
        switch (activity) {
            case ActivityLevel.Active:
                p = 1.725;
                break;
            case ActivityLevel.SomewhatActive:
                p = 1.357;
                break;
            case ActivityLevel.Sedentary:
                p = 1.2;
                break;
        }
        return bmr * p;
    }
    proteinTarget(user: IUser): number {
        const lean = 1 - (user.bodyFatPercentage / 100);
        return user.weight * lean;
    }
    carbsTarget(cals: number): number {
        const targetCalories = cals / 2;
        return targetCalories / 4;
    }
    fatTarget(cals: number): number {
        const targetCalories = cals * 0.3;
        return targetCalories / 9;
    }
}
