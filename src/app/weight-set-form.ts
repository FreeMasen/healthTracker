import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Data } from './services/data';
import * as moment from 'moment';
import { IWeightSet } from './services/database';
import { Messenger } from './services/messenger';
@Component({
    selector: 'weight-set-form',
    templateUrl: 'weight-set-form.html',
    styleUrls: ['weight-set-form.scss']
})
export class WeightSetForm implements OnInit {
    weightSet: FormGroup;
    id: string;
    constructor(
        private builder: FormBuilder,
        private data: Data,
        private router: Router,
        private route: ActivatedRoute,
        private msg: Messenger,
    ) {}

    async ngOnInit() {
        this.route.paramMap.subscribe(async (map) => {
            this.id = map.get('id');
            if (!!this.id) {
                await this.initializeWithId(this.id);
            } else {
                await this.initialize();
            }
        });
    }

    async initializeWithId(id: string) {
        const set = await this.data.getWeightSet(id);
        this.weightSet = this.builder.group({
            name: set.name,
            weight: set.weight,
            reps: set.reps,
            when: set.when,
        });
    }
    async initialize() {
        this.weightSet = this.builder.group({
            name: '',
            weight: 0,
            reps: 10,
            when: moment(),
        });
    }

    async save() {
        const set: IWeightSet = {
            id: this.id,
            name: this.weightSet.get('name').value,
            weight: this.weightSet.get('weight').value,
            reps: this.weightSet.get('reps').value,
            when: this.weightSet.get('when').value,
        };
        try {
            if (!!this.id) {
                await this.data.updateWeightSet(set);
            } else {
                await this.data.addWeightSet(set);
            }
        } catch (e) {
            return this.msg.send(`Unable to save new weight set ${e.message}`, true)
        }
        this.msg.send('Successfully saved new weight set', false);
        this.router.navigate([]);
    }
}