import { Component, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { Messenger } from './services/messenger';
import { Router } from '@angular/router';
import { Data } from './services/data';
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
    }
    ngAfterContentInit() { 
    }

    async download() {
        console.log('download');
        let data = await this.data.getAllUserData();
        console.log('data', data);
        let json = JSON.stringify(data);
        console.log('json', json);
        let b = new Blob([json], {type: 'text/json'});
        let url = URL.createObjectURL(b);
        let loweredUA = window.navigator.userAgent.toLocaleLowerCase();
        if (loweredUA.indexOf('ios') > -1
            || loweredUA.indexOf('android') > -1) {
            window.open(url, '_blank');
        } else {
        let link = document.createElement('a');
        console.log('url', url);
        link.setAttribute('href', url);
        link.setAttribute('download', 'healthTrackerHistory.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
