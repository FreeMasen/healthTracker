import { Component, ViewChild } from '@angular/core';
import { Data } from './services/data';
import { FormControl } from '@angular/forms';
import { IArchive } from './services/database';
import { Messenger } from './services/messenger';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

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
        let json = await this.readFile(file);
        let data: IArchive;
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.error('error parsing json file', e);
        }
        console.log(data);
        let res = await this.data.importArchive(data);
        this.msg.send(`Import complete, added ${res.meals} meals, ${res.items} meal items and ${res.body} body compositions`, false);
        this.location.back()
    }

    async readFile(file: File): Promise<string> {
        return new Promise((r, j) => {
            let reader = new FileReader();
            reader.onload = ev => {
                return r((ev.target as any).result)
            }
            reader.readAsText(file);
        });
    }
}