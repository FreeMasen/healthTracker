import { Component, Input, ViewChild } from '@angular/core';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTree} from '@angular/material/tree';
import { Data, IFoodDetail, INutrient, IWeightInfo, IFoodDesc } from './services/data';
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
    food: IFoodDesc;
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
        if (this.food && this.food.id === this.foodId) return;
        let food = await this.data.foodDetails(this.foodId)
        this.inputForm = this.builder.group({
            measurement: 100,
            measurementUnit: 'g',
        });
        this.food = food;
        let info = this.nutritionInfo();
        let weights: IWeightInfo[] = await this.data.weights.where('foodDesId').equals(this.foodId).toArray();
        this.measurementOptions = [{measurementDesc: 'grams', amount: 100, grams: 100, foodDescId: this.foodId, seq: -1}].concat(weights)
        setTimeout(() => this.dataSource.data = info, 10)
    }

    nutritionInfo(): INutritionNode[] {
        if (!this.food) {
            return [];
        }
        return [
            {
                value: `Calories: ${this.food.calories}`,
                level: 1,
                expandable: true,
                children: [{
                    value: `Carbs: ${this.food.carbs} g`,
                    level: 2,
                    expandable: true,
                    children: []
                }, {
                    value: `Fat: ${this.food.fat} g`,
                    level: 2,
                    expandable: false,
                    children: []
                }, {
                    value: `Protein: ${this.food.protein} g`,
                    level: 2,
                    expandable: false,
                    children: []
                }],
            }
        ];
    }
}