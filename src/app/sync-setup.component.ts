// import { Component } from '@angular/core';
// import { Location } from '@angular/common';
// import { Sync } from './services/sync';

// @Component({
//     selector: 'sync-setup',
//     templateUrl: './sync-setup.template.html',
//     styleUrls: ['./sync-setup.style.scss']
// })
// export class SyncSetupComponent {
//     dropboxSetup = false;
//     constructor(
//         public sync: Sync,
//         public location: Location,
//     ) { }


//     async ngOnInit() {
//         if (location.hash.length > 0) {
//             await this.sync.completeDropboxSetup();
//             this.location.go("")
//         }
//         this.dropboxSetup = await this.sync.hasDropboxSetup();
//     }

//     async setupDropbox() {
//         await this.sync.requestNewDropbox();
//     }


//     get dropboxMessage(): string {
//         return this.dropboxSetup 
//             ? 'Dropbox is already setup!'
//             : 'Click the button on the right to setup dropbox';
//     }
// }