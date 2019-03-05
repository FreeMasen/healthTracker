import { Component, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { Messenger } from './services/messenger';
import { Data, IUser } from './services/data';
import { normalizeString } from './services/util';
import { PersonalInfoComponent } from './personal-info.component';
import { MatGridTileHeaderCssMatStyler } from '@angular/material';

@Component({
    selector: 'seeder',
    templateUrl: './seeder.template.html',
    styleUrls: ['./seeder.style.scss']
})
export class SeederComponent {
    tables: ITableStatus[] = [];
    @ViewChild(PersonalInfoComponent)
    private personalInfo: PersonalInfoComponent;
    private userSaved = false;
    constructor(
        private location: Location,
        private messenger: Messenger,
        private data: Data,
    ) { }
    async ngOnInit() {
        if (await this.data.hasBeenSeeded()) {
            this.tables = this.data.seedTableNames().map(n => ({table: n, state: 'complete' as State, target: 100, value: 100}));
            return; 
        } else {
            this.tables = this.data.seedTableNames().map(n => ({table: n, state: 'pending' as State, target: 100, value: 0}));
        }
        let worker;
        try {
            worker = new Worker('./assets/worker.js');
        } catch (e) {
            console.error('error creating worker', e);
        }
        worker.onmessage = (msg: MessageEvent) => {
            let {event, table, target, value} = msg.data;
            let idx = this.tables.findIndex(t => t.table == table);
            switch (event) {
                case 'fetching':
                    this.tables[idx] = Object.assign({}, this.tables[idx], {table, target, value, state: 'fetching'});
                break;
                case 'seeding':
                case 'starting-seed':
                    this.tables[idx] = Object.assign({}, this.tables[idx], {value: (value / target) * 100, state: 'inserting'});
                break;
                case 'clearing':
                    this.tables[idx] = Object.assign({}, this.tables[idx], {state: 'clearing'})
                break;
                case 'complete':
                this.tables[idx] =  Object.assign({}, this.tables[idx], {state: 'complete'});
                break;
                case 'all-complete':
                    if (this.userSaved) {
                        this.allComplete();
                    }
                break;
                case 'error':
                    console.error('error seeding database', msg.data.error);
                    this.messenger.send('error seeding database', true);
                break;
            }
        };
    }
    ngAfterViewInit() {
        this.personalInfo.onSave.subscribe(() => this.onUserSaved());
    }

    onUserSaved() {
        this.userSaved = true;
        if (this.tables.findIndex(t => t.state != 'complete') < 0) {
            this.allComplete();
        }
    }
    allComplete() {
        if (this.location.isCurrentPathEqualTo('/seed')) {
            this.location.back();
        }
    }
}

@Pipe({name: 'state'})
export class StatePipe implements PipeTransform {
  transform(value: State): string {
    switch (value) {
        case 'complete':
            return 'Complete'
        case 'inserting':
            return 'Inserting values into database';
        case 'fetching':
            return 'Getting data from server';
        case 'clearing':
            return 'Clearing any old data';
        case 'pending':
            return 'Waiting for last table to complete';
    }
  }
}

@Pipe({name: 'tableName'})
export class TableNamePipe implements PipeTransform {
    transform(value: string): string {
        return normalizeString(value).replace('Defs', 'Definitions');
    }
}

interface ITableStatus {
    table: string;
    target: number;
    value: number;
    state: State;
}

type State = 'complete' | 'inserting' | 'fetching' | 'clearing' | 'all-complete' | 'error' | 'pending';

