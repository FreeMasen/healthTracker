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
    async fileSelected() {
        const file = this.importFile.nativeElement.files[0];
        const json = await readFile(file);
        let data: IArchive;
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.error('error parsing json file', e);
            this.msg.send('failed to import file, unable to parse json', true);
            return;
        }
        const mapped: IArchive = {
            mealHistory: data.mealHistory.map(this.sanitizeId),
            bodyHistory: data.bodyHistory.map(this.sanitizeId),
            weightSetHistory: data.weightSetHistory.map(this.sanitizeId)
        };
        const res = await this.data.importArchive(mapped);
        this.msg.send(`Import complete, added ${res.meals} meals, ${res.items} meal items and ${res.body} body compositions`, false);
        this.location.back();
    }
    private sanitizeId<T>(obj: T): T {
        if (typeof (obj as any).id !== 'string') {
            delete (obj as any).id;
        }
        return obj;
    }
}

interface IIdentified {
    id: any;
}