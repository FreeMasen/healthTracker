import { Injectable } from '@angular/core';
import { IUser, ActivityLevel } from './database';
export interface IMetabolismInfo {
    basalMan: number;
    basalWoman: number;
    needMan: number;
    needWoman: number;
    proteinTarget: number;
}
@Injectable({
    providedIn: 'root',
})
export class MetabolismCalculator {
    constructor(

    ) {}
    getMetabolismInfo(user: IUser): IMetabolismInfo {
        const basalMan = this.basalMan(user);
        const basalWoman = this.basalWoman(user);
        const needMan = this.bmrToNeed(basalMan, user.activityLevel as ActivityLevel);
        const needWoman = this.bmrToNeed(basalWoman, user.activityLevel as ActivityLevel);
        const proteinTarget = this.proteinTarget(user);
        return {
            basalMan,
            basalWoman,
            needMan,
            needWoman,
            proteinTarget,
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
             + (5 * age)
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
}
