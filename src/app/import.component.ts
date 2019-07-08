import { Component, ViewChild } from '@angular/core';
import { Data } from './services/data';
import { FormControl } from '@angular/forms';
import { IArchive } from './services/database';
import { Messenger } from './services/messenger';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { readFile } from './services/util';

@Component({
    selector: 'import-history',
    templateUrl: './import.html',
    styleUrls: ['./import.scss'],
})
export class ImportComponent {
    @ViewChild('importFile') importFile;
    constructor(
        private data: Data,
        private msg: Messenger,
        private router: Router,
        private location: Location,
    ) { }
    ngOnInit() {
    }
    async fileSelected() {
        let file = this.importFile.nativeElement.files[0];
        let json = await readFile(file);
        let data: IArchive;
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.error('error parsing json file', e);
            this.msg.send('failed to import file, unable to parse json', true);
            return;
        }
        let mapped = {
            mealHistory: data.mealHistory.map(h => {
                if (typeof h.id !== 'string') {
                    delete h.id;
                }
                return h
            }),
            bodyHistory: data.bodyHistory.map(h => {
                if (typeof h.id !== 'string') {
                    delete h.id
                }
                return h
            }),
        };
        let res = await this.data.importArchive(mapped);
        this.msg.send(`Import complete, added ${res.meals} meals, ${res.items} meal items and ${res.body} body compositions`, false);
        this.location.back()
    }
}