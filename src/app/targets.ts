import { Component, OnInit, EventEmitter } from '@angular/core';
import { Data } from './services/data';
import { MetabolismCalculator, IMetabolismInfo } from './services/metabolism';
import { IUser, MetabolismGender } from './services/database';
@Component({
    selector: 'targets',
    templateUrl: './targets.html',
    styleUrls: ['./targets.scss']
})
export class TargetsComponent implements OnInit {
    MetabolismGender = MetabolismGender;
    user: IUser;
    metabolicInfo: IMetabolismInfo;
    genderPref: MetabolismGender;
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
        const prefs = await this.data.getUserPrefs();
        this.genderPref = prefs.metabolismGender;
        await this.updateState();
    }
    async updateState() {
        const lastUser = await this.data.getLatestUser();
        if (!lastUser) {
            return console.error('unable to get last user');
        }
        this.metabolicInfo = this.meta.getMetabolismInfo(lastUser, this.genderPref);
    }

    async setGenderPrefs(ev: any) {
        const newValue = ev.value as MetabolismGender;
        this.genderPref = await this.data.setGenderPref(newValue);
        await this.updateState();
    }

}
