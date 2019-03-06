import { Component, ViewChild } from '@angular/core';
import { Data } from './services/data';
import { FormControl } from '@angular/forms';
import { IArchive } from './services/database';

@Component({
    selector: 'import-history',
    templateUrl: './import.html',
    styleUrls: ['./import.scss'],
})
export class ImportComponent {
    @ViewChild('importFile') importFile;
    constructor(
        private data: Data,
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
        this.data.importArchive(data)
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