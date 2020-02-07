import { Component, ViewChild, OnInit } from '@angular/core';
import { Data, IUser, Day } from './services/data';
import * as moment from 'moment';
import { TargetsComponent } from './targets';
import { smallScreen, formatDate } from './services/util';
import { MatDialog } from '@angular/material';
import { WorkoutGeneratorComponent } from './workout-generator';

@Component({
    selector: 'health-dashboard',
    styleUrls: ['./dashboard.style.scss'],
    templateUrl: './dashboard.template.html',
})
export class DashboardComponent implements OnInit {
    history: IUser[] = [];
    today: Day;
    columnsToDisplay = ['updated', 'weight', 'bodyFatPercentage', 'delete', 'edit'];
    mealColumns = ['name', 'time', 'calories', 'carbs', 'fat', 'protein', 'delete', 'edit'];
    showTargets = false;
    @ViewChild('targetsChild') targetsChild: TargetsComponent;
    get smallScreen(): boolean {
        return smallScreen();
    }
    constructor(
        private data: Data,
        public workoutGenDialog: MatDialog,
    ) { }
    async ngOnInit() {
        this.history = await this.data.getUserHistory();
        this.today = await this.data.getTodaysEntries();
        this.data.renderableChanges.subscribe(async () => {
            this.history = await this.data.getUserHistory();
            this.today = await this.data.getMealsForDay(this.today.date);
        });
        this.targetsChild.hide.subscribe(() => this.setTargets(false));
    }
    remoteEntry(id: string) {
        this.data.removeUserEntry(id).then(() => {
            this.history = this.history.filter(e => e.id !== id);
        });
    }

    removeMeal(id: string) {
        this.data.removeMeal(id).then(() => {
            const newMeals = this.today.meals.filter(m => m.id !== id);
            this.today = new Day(this.today.date, newMeals, this.today.id);
        });
    }

    prevDay() {
        const today = moment(this.today.date.toISOString());
        today.day(today.day() - 1);
        this.data.getMealsForDay(today).then(day => {
            this.today = day;
        });
    }

    nextDay() {
        if (this.canGoForward) {
            const today = moment(this.today.date.toISOString());
            today.day(today.day() + 1);
            this.data.getMealsForDay(today).then(day => {
                this.today = day;
            });
        }
    }

    canGoForward(): boolean {
        const diff = Math.abs(this.today.date.diff(moment(), 'days'));
        return Math.floor(diff) < 1;
    }

    currentDate(): string {
        if (this.today.date.isSame(moment().startOf('day'))) {
            return 'Today';
        }
        if (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) < 550) {
            return this.today.date.format('M/D/YY');
        }
        return this.today.date.format('ddd MMM Do, YYYY');
    }

    formatBodyDate(date: moment.Moment): string {
        return formatDate(date);
    }
    get descHeader(): string {
        if (smallScreen()) {
            return 'Desc';
        }
        return 'Description';
    }
    get calHeader(): string {
        if (smallScreen()) {
            return 'Cal';
        }
        return 'Calories';
    }

    get carbsHeader(): string {
        if (smallScreen()) {
            return 'Car';
        }
        return 'Carbs';
    }
    get protHeader(): string {
        if (smallScreen()) {
            return 'Pro';
        }
        return 'Protein';
    }

    get ttlHeader(): string {
        if (smallScreen()) {
            return 'Ttl';
        }
        return 'Total';
    }

    get bfpHeader(): string {
        if (smallScreen()) {
            return 'BF%';
        }
        return 'Body Fat %';
    }

    get weightHeader(): string {
        if (smallScreen()) {
            return 'Lbs';
        }
        return 'Weight';
    }

    get fixedWidth(): number {
        if (smallScreen()) {
            return 0;
        }
        return 2;
    }

    setTargets(newValue: boolean) {
        this.showTargets = newValue;
    }

    showWorkoutGenerator() {
        this.workoutGenDialog.open(WorkoutGeneratorComponent, {

        });
    }
}

