import { Component, OnInit, EventEmitter } from '@angular/core';
import { Data } from './services/data';
import { MetabolismCalculator } from './services/metabolism';
import { IUser } from './services/database';
@Component({
    selector: 'targets',
    templateUrl: './targets.html',
    styleUrls: ['./targets.scss']
})
export class TargetsComponent implements OnInit {
    user: IUser;
    metabolicInfo; IMetabolismInfo;
    public hide = new EventEmitter<void>();
    constructor(
        private data: Data,
        private meta: MetabolismCalculator
    ) {
        this.data.renderableChanges.subscribe(
            async () => await this.updateState()
        );
    }

    async ngOnInit() {
        await this.updateState();
    }
    async updateState() {
        console.log('updating targets state');
        let lastUser = await this.data.getLatestUser();
        if (!lastUser) {
            return console.error('unable to get last user');
        }
        this.metabolicInfo = this.meta.getMetabolismInfo(lastUser);
    }
}
