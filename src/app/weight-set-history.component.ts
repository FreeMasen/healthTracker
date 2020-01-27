import { Component, OnInit, EventEmitter } from '@angular/core';
import { Data } from './services/data';
import { IWeightSet } from './services/database';

@Component({
    selector: 'weight-set-history',
    templateUrl: './weight-set-history.html',
    styleUrls: ['./weight-set-history.scss'],
})
export class WeightSetHistory implements OnInit {
    hide = new EventEmitter();
    history: IWeightSet[];
    columnsToDisplay = ['name', 'weight', 'reps', 'when', 'edit', 'del']
    constructor(
        private data: Data,
    ) {}
    async ngOnInit() {
        this.data.renderableChanges.subscribe(async () => {
            this.history = await this.data.getRecentWeightSets();
        });
        this.history = await this.data.getRecentWeightSets();
    }

    async deleteItem(item: IWeightSet) {
        await this.data.deleteWeightSet(item.id);
    }
}