import { Component } from '@angular/core';
import { Data, IUser, Day } from './services/data';
import * as moment from 'moment';

@Component({
    selector: 'health-dashboard',
    styleUrls: ['./dashboard.style.scss'],
    templateUrl: './dashboard.template.html',
})
export class DashboardComponent {
    history: IUser[] = [];
    today: Day;
    columnsToDisplay = ['updated', 'weight', 'bodyFatPercentage', 'delete', 'edit'];
    mealColumns = ['name', 'time', 'calories', 'carbs', 'fat', 'protein', 'delete', 'edit'];
    constructor(
        private data: Data
    ) { }
    async ngOnInit() {
        this.history = await this.data.getUserHistory();
        this.today = await this.data.getTodaysEntries();
    }
    remoteEntry(id: number) {
        this.data.removeUserEntry(id).then(() => {
            this.history = this.history.filter(e => e.id != id);
        });
    }

    removeMeal(id: number) {
        this.data.removeMeal(id).then(() => {
            let newMeals = this.today.meals.filter(m => m.id != id);
            this.today = new Day(this.today.date, newMeals, this.today.id);
        })
    }

    prevDay() {
        let today = moment(this.today.date.toISOString());
        today.day(today.day() - 1);
        this.data.getMealsForDay(today).then(day => {
            this.today = day;
        });
    }

    nextDay() {
        if (this.canGoForward) {
            let today = moment(this.today.date.toISOString());
            today.day(today.day() + 1);
            this.data.getMealsForDay(today).then(day => {
                this.today = day;
            });
        }
    }

    canGoForward(): boolean {
        let diff = Math.abs(this.today.date.diff(moment(), 'days'));
        return Math.floor(diff) < 1;
    }

    currentDate(): string {
        if (this.today.date.isSame(moment().startOf('day'))) {
            return 'Today';
        }
        return this.today.date.format('ddd MMM Do, YYYY');
    }
}