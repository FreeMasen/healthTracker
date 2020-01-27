import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Data, IFoodDesc, MealItem } from './services/data';
import { Messenger } from './services/messenger';

@Component({
    selector: 'search-component',
    templateUrl: './search-template.html',
    styleUrls: ['./search-style.scss'],
})
export class SearchComponent {
    term = new FormControl('');
    public foods: MealItem[] = [];
    private debounce;
    @Output() onFoodClicked = new EventEmitter<number>()
    constructor(public data: Data, private messenger: Messenger) {
    }
    async ngOnInit() {
        if (this.data.isReady()) {
            this.subscribe();
        } else {
            this.term.disable();
            this.messenger.send('Unable to search while database is setting up', true);
        }
    }
    subscribe() {
        this.term.valueChanges.subscribe(next => {
            if (this.debounce) {
                clearTimeout(this.debounce);
            }
            this.debounce = setTimeout(async () => await this.searchDatabase(), 500);
        });
    }
    async searchDatabase() {
        let term = this.term.value;
        if (term === '') {
            return;
        }
        this.foods = await this.data.findFood(term);
    }
    foodClicked(id: number) {
        this.onFoodClicked.emit(id);
    }
}