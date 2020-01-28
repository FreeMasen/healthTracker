import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Data } from './services/data';
import { IWeightSet } from './services/database';
import { Messenger } from './services/messenger';
import { WeightCalculator } from './weight-set-weight-calculator';
@Component({
    selector: 'weight-set-form',
    templateUrl: 'weight-set-form.html',
    styleUrls: ['weight-set-form.scss']
})
export class WeightSetForm implements OnInit {
    weightSet = this.builder.group({
        name: ['', Validators.required],
        weight: ['0', Validators.min(2.5)],
        reps: ['10', Validators.min(1)],
        when: [moment().toDate(), Validators.required],
        repeated: ['1', Validators.min(1)],
    });
    id?: string = null;
    bodyWeight = 0;
    name = '';
    weight = 0;
    reps = 0;
    when = moment();
    repeated = 1;
    recommendedSets: Observable<string[]>;
    @ViewChild(MatAutocomplete)
    autoComplete: MatAutocomplete;
    constructor(
        private builder: FormBuilder,
        private data: Data,
        private router: Router,
        private route: ActivatedRoute,
        private msg: Messenger,
        public dialog: MatDialog,
    ) {}

    async ngOnInit() {
        this.setupSearch();
        this.bodyWeight = await this.data.getLastWeight();
        this.route.paramMap.subscribe(async (map) => {
            this.id = map.get('id');
            this.weightSet.valueChanges.subscribe(change => {
                this.name = change.name;
                this.weight = change.weight;
                this.reps = change.reps;
                this.when = moment(change.when);
                this.repeated = change.repeated;
            });
            if (!!this.id) {
                await this.initializeWithId(this.id);
            }
        });
    }

    setupSearch() {
        const name = this.weightSet.get('name');
        this.recommendedSets = name.valueChanges.pipe(
            debounceTime(300),
            switchMap((n, i) => this.getRecommendations(n as string)),
        );
        this.autoComplete.optionSelected.subscribe(this.handleAutoSelection.bind(this));
    }

    async handleAutoSelection(ev: MatAutocompleteSelectedEvent) {
        const set = await this.data.mostRecentFor(ev.option.value);
        this.weightSet.setValue({
            name: set.name,
            weight: set.weight,
            reps: set.reps,
            when: this.when,
            repeated: this.repeated,
        });
    }

    async getRecommendations(name: string): Promise<string[]> {
        return await this.data.searchDistinctExerciseNames(name);

    }

    async initializeWithId(id: string) {
        const set = await this.data.getWeightSet(id);
        this.weightSet.setValue({
            name: set.name,
            weight: set.weight,
            reps: set.reps,
            when: set.when,
            repeated: '1',
        }, {emitEvent: true, onlySelf: true});
    }

    async save() {
        const set: IWeightSet = {
            name: this.name,
            weight: this.weight,
            reps: this.reps,
            when: this.when,
        };
        try {
            if (!!this.id) {
                set.id = this.id;
                await this.data.updateWeightSet(set);
            } else {
                for (let i = 0; i < this.repeated; i++) {
                    await this.data.addWeightSet(set);
                }
            }
        } catch (e) {
            return this.msg.send(`Unable to save new weight set ${e.message}`, true);
        }
        this.msg.send('Successfully saved new weight set', false);
        this.router.navigate(['']);
    }

    calculateWeight() {
        const dia = this.dialog.open(WeightCalculator, {
            data: {
                bodyWeight: this.bodyWeight
            }
        });
        dia.afterClosed().subscribe(result => {
            let v = this.weightSet.get('weight').value;
            switch (result.type) {
                case 'barbell':
                    v = (result.side * 2) + result.barbell;
                    break;
                case 'dumbbell':
                    v = result.hand * 2;
                    break;
                case 'bodyWeight':
                    v = result.weight;
                    break;
            }
            this.weightSet.setValue({
                name: this.name,
                weight: v,
                reps: this.reps,
                when: this.when,
                repeated: this.repeated,
            }, {emitEvent: true, onlySelf: true});
        });
    }
}
