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
        const need = this.bmrToNeed(user, basal);
        return {
            basal,
            need,
            proteinTarget: this.proteinTarget(user),
            carbsTarget: this.carbsTarget(need),
            fatTarget: this.fatTarget(need),
        };
    }
    basalMan(user: IUser) {
        const height = this.inchesToCm(user.height);
        const weight = this.lbToKg(user.weight);
        const one = this.mifflin(
            weight,
            height,
            user.age,
            true,
        );
        console.log('mifflin', one);
        const two = this.katchMcArdle(
            weight,
            user.bodyFatPercentage,
        );
        console.log('katch mcardle', two);
        const three = this.harrisBenedict(
            weight,
            height,
            user.age,
            true,
        );
        console.log('harris benedict', three);
        const four = this.cunninghamBmr(
            weight,
            user.bodyFatPercentage,
        );
        console.log('cunningham bmr', four);

        return (one + two + three + four) / 4;
    }
    basalWoman(user: IUser): number {
        const height = this.inchesToCm(user.height);
        const weight = this.lbToKg(user.weight);
        const one = this.mifflin(
            weight,
            height,
            user.age,
            false,
        );
        console.log('mifflin', one);
        const two = this.katchMcArdle(
            weight,
            user.bodyFatPercentage,
        );
        console.log('katch mcardle', two);
        const three = this.harrisBenedict(
            weight,
            height,
            user.age,
            false,
        );
        console.log('harris benedict', three);
        const four = this.cunninghamBmr(
            weight,
            user.bodyFatPercentage,
        );
        console.log('cunningham bmr', four);
        return (one + two + three + four) / 4;
    }

    private inchesToCm(height: number) {
        return height * 2.54;
    }

    private lbToKg(lb: number): number {
        return lb * 0.454;
    }

    bmrToNeed(user: IUser, bmr: number): number {
        let p = 1.2;
        switch (user.activityLevel) {
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
        const one = bmr * p;
        const two = this.cunningham(
            this.lbToKg(user.weight),
            user.bodyFatPercentage,
            user.activityLevel as ActivityLevel,
            0
        );
        return (one + two) / 2;

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

    mifflin(kg: number, cm: number, age: number, male: boolean) {
        const s = male ? 5 : -151;
        const m = 10 * kg;
        const h = 6.25 * cm;
        const a = 5.0 * age;
        return (m + h - a) + s;
    }
    katchMcArdle(kg: number, bfp: number) {
        const leanPercent = 1 - (bfp / 100);
        const lean = kg * leanPercent;
        return 370 + (21.6 * lean);
    }

    harrisBenedict(kg: number, cm: number, age: number, male: boolean) {
        const s = male ? 88.362 : 447.593;
        const m = male ? 13.397 : 9.247;
        const h = male ? 4.799 : 3.098;
        const a = male ? 5.677 : 4.33;
        const m2 = m * kg;
        const h2 = cm * h;
        const a2 = age * a;
        return (m2 + h2 + a2) + s;
    }

    cunningham(
        kg: number,
        bfp: number,
        level: ActivityLevel,
        trainingMins: number,
    ) {
        const rmr = this.cunninghamBmr(kg, bfp);
        const tef = rmr * 0.1;
        const neatF = this.cunninghamLevelValue(level);
        const rmrAndNeat = rmr * neatF;
        const neat = rmrAndNeat + tef;
        const metricMins = trainingMins / 60;
        const erat = kg * metricMins * 6;
        return neat + erat;
    }

    cunninghamBmr(
        kg: number,
        bfp: number,
    ) {
        const fm = kg * (bfp / 100);
        const ffm = kg - fm;
        return 500 + (22 * ffm);
    }

    cunninghamLevelValue(level: ActivityLevel) {
        switch (level) {
            case ActivityLevel.Active:
                return 1.6;
            case ActivityLevel.SomewhatActive:
                return 1.5;
            case ActivityLevel.Sedentary:
                return 1.4;
            default:
                throw new Error('Non-exhaustive switch');
        }
    }
}
