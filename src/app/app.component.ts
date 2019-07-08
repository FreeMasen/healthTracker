import { Component, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { Messenger } from './services/messenger';
import { Router } from '@angular/router';
import { Data } from './services/data';
import { Sync } from './services/sync';
const TIMEOUT = 3000;
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    title = 'healthTracker';
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    private snack;
    private snackCount = 0;
    
    constructor(
        private router: Router,
        private messenger: Messenger,
        private data: Data,
        private sync: Sync,
    ) { 
        
    }

    async ngOnInit() {
        let hasBeenSeeded = await this.data.hasBeenSeeded();
        if (!hasBeenSeeded) {
            this.messenger.send('Establishing Database', false)
            try {
                this.router.navigate(['seed'])
            } catch (e) {
                console.error('Failed to navigate to seed', e);
                throw e;
            }
        }
        this.data.syncableChanges.subscribe(async () => {
            await this.sync.triggerSync();
        });
    }
    ngAfterContentInit() { 
    }

    async download() {
        let data = await this.data.getAllUserData();
        let json = JSON.stringify(data);
        let b = new Blob([json], {type: 'application/json'});
        let url = URL.createObjectURL(b);
        let loweredUA = window.navigator.userAgent.toLocaleLowerCase();
        if (loweredUA.indexOf('ios') > -1
            || loweredUA.indexOf('android') > -1) {
            window.open(url, '_blank');
        } else {
            let link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'healthTrackerHistory.json');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    goToSyncSetup() {
        this.router.navigateByUrl('/setup-sync')
    }
}
