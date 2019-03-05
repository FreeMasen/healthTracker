import { Component, Input, ViewChild } from '@angular/core';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTree} from '@angular/material/tree';
import { Data, IFoodDetail, INutrient, IWeightInfo } from './services/data';
import { FormBuilder, FormGroup } from '@angular/forms';

interface INutritionNode {
    value: string;
    level: number;
    children: INutritionNode[];
    expandable: boolean;
}
@Component({
    selector: 'food-details',
    templateUrl: './food-details.html',
    styleUrls: ['./food-details.scss'],
})
export class FoodDetails {
    food: IFoodDetail;
    flatTransForm = (node: INutritionNode) => {
        return node;
    };
    flatLevel = (node: INutritionNode) => {
        return node.level;
    };
    flatExpandable = (node: INutritionNode) => {
        return node.children.length > 0
    };
    flatChildren = (node: INutritionNode) => {
        return node.children;
    }
    tree = new FlatTreeControl<INutritionNode>(this.flatLevel, this.flatExpandable);
    flattener = new MatTreeFlattener<INutritionNode, INutritionNode>(this.flatTransForm, this.flatLevel, this.flatExpandable, this.flatChildren)
    dataSource = new MatTreeFlatDataSource(this.tree, this.flattener);
    inputForm: FormGroup;
    measurementOptions: IWeightInfo[] = [];
    selectedWeightId = -1;
    @Input() foodId: number;
    constructor(
        private data: Data,
        private builder: FormBuilder,
    ) {

    }
    async ngOnInit() {
        if (!this.foodId) return;
        await this.setup();
    }
    
    async ngOnChanges() {
        if (!this.foodId) return;
        await this.setup();
    }

    async setup() {
        if (this.food && this.food.foodDesc.id === this.foodId) return;
        let food = await this.data.foodDetails(this.foodId)
        this.inputForm = this.builder.group({
            measurement: 100,
            measurementUnit: 'g',
        });
        this.food = food;
        let info = this.nutritionInfo();
        let weights = this.food.weights;
        if (weights.findIndex(w => w.measurementDesc === 'grams') < 0) {
            this.measurementOptions.unshift({measurementDesc: 'grams', amount: 100, grams: 100, foodDescId: this.foodId, seq: -1});
        }
        this.measurementOptions = this.food.weights;
        setTimeout(() => this.dataSource.data = info, 10)
    }

    nutritionInfo(): INutritionNode[] {
        if (!this.food) {
            return [];
        }
        return [
            {
                value: `Calories: ${this.food.energy.calories}`,
                level: 1,
                expandable: true,
                children: [{
                    value: `Carbs: ${this.food.energy.carbs.grams} g`,
                    level: 2,
                    expandable: true,
                    children: [{
                        value: `Sugars: ${this.food.energy.carbs.sugars.data.val} ${this.food.energy.carbs.sugars.def.units}`,
                        level: 3,
                        expandable: false,
                        children: [],
                    }]
                }, {
                    value: `Fat: ${this.food.energy.fat.data.val} ${this.food.energy.fat.def.units}`,
                    level: 2,
                    expandable: false,
                    children: []
                }, {
                    value: `Protein: ${this.food.energy.protein.data.val} ${this.food.energy.protein.def.units}`,
                    level: 2,
                    expandable: false,
                    children: []
                }],
            },
            {
                value: 'Additional Info',
                level: 1,
                expandable: true,
                children: this.food.nutrients.map(n => ({value: `${n.data.val} ${n.def.units}`, level: 2, expandable: false, children: []}))
            }
        ];
    }
}