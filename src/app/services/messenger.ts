import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root',
})
export class Messenger {
    private listener: (message: string, isError: boolean) => void;
    private queue: [string, boolean][] = [];
    constructor() { }

    public registerListener(listener: (message: string, isError: boolean) => void) {
        this.listener = listener;
        if (this.queue.length > 0) {
            let msg: [string, boolean];
            while (msg = this.queue.shift()) {
                this.listener(...msg);

            }
        }
    }

    public send(message: string, isError: boolean) {
        if (this.listener) {
            this.listener(message, isError);
        } else {
            this.queue.push([message, isError]);
        }
    }

}