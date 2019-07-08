import { Component } from '@angular/core';
import { Messenger } from './services/messenger';
import { MatSnackBar } from '@angular/material/';

@Component({
    selector: 'message-toast',
    styleUrls: ['./message-component.style.scss'],
    templateUrl: './message-component.template.html',
})
export class MessageComponent {
    private messageQueue: [string, boolean][] = [];
    constructor(
        private snackBar: MatSnackBar,
        private messenger: Messenger,
    ) { 
    }
    ngOnInit() {
        this.messenger.registerListener((msg, isError) => this.addMessage(msg, isError))
    }
    
    addMessage(msg: string, isError: boolean) {
        let send = this.messageQueue.length < 1;
        this.messageQueue.push([msg, isError]);
        if (send) {
            this.displayMessage();
        }
    }

    displayMessage() {
        setTimeout(() => this.snackBar.open(this.messageQueue.shift()[0], 
                            null, {duration: 2000}).afterDismissed().subscribe(() => this.messageTimeout()), 0);
    }


    messageTimeout() {
        if (this.messageQueue.length > 0) {
            this.displayMessage();
        }
    }
}