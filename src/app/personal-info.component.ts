import { Component, Output, EventEmitter } from '@angular/core';
import { ActivityLevel, Data, IUser } from './services/data';
import { normalizeString } from './services/util';
import { Messenger } from './services/messenger';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Component({
    selector: 'personal-info',
    templateUrl: './personal-info.html',
    styleUrls: ['./personal-info.scss'],
})
export class PersonalInfoComponent {
    weight: number;
    heightFeet: number;
    heightInches: number;
    age: number;
    bodyFatPercent: number;
    activityLevel: ActivityLevel;
    weightTarget: number;
    activityLevels = Object.getOwnPropertyNames(ActivityLevel).map(name => ActivityLevel[name]);
    @Output() onSave = new EventEmitter<void>();
    constructor(
        private data: Data,
        private messenger: Messenger,
        private location: Location,
        private route: ActivatedRoute,
    ) {}
    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        let user: IUser;
        if (id) {
            user = await this.data.users.get(id);
        } else {
            user = await this.data.getLatestUser();
        }
        if (user) {
            this.weight = user.weight;
            this.heightFeet = Math.floor(user.height / 12);
            this.heightInches = user.height - (this.heightFeet * 12);
            this.age = user.age;
            this.bodyFatPercent = user.bodyFatPercentage;
            this.activityLevel = user.activityLevel as ActivityLevel;
            this.weightTarget = user.weightTarget;
        }
    }
    async saveInfo() {
        const user = this.infoAsUser();
        const firstMissing = Object.getOwnPropertyNames(user).find(name => name !== 'id' && user[name] === undefined);
        if (firstMissing) {
            return this.messenger.send(`${normalizeString(firstMissing)} is required`, true);
        }
        if (user.id) {
            await this.data.users.put(user).then(() => {
                this.location.back();
            });
        } else {
            await this.data.addUser(user).then(() => {
                this.onSave.emit();
                if (this.location.isCurrentPathEqualTo('/personal-info/add')) {
                    this.location.back();
                }
            });
        }
    }

    infoAsUser(): IUser {
        const ret: IUser = {
            weight: this.weight,
            height: (this.heightInches || 0) + (this.heightFeet * 12),
            age: this.age,
            bodyFatPercentage: this.bodyFatPercent,
            activityLevel: this.activityLevel,
            weightTarget: this.weightTarget,
            updated: +moment(),
            deleted: false,
        };
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id.length !== 0) {
            ret.id = id;
        }
        return ret;
    }
}
