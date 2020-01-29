import { Component, OnInit } from '@angular/core';
import { WorkoutGenerator } from './services/workoutGenerator';
import { Workout, WorkoutKind } from './services/data';

@Component({
    selector: 'workout-generator',
    templateUrl: './workout-generator.html',
    styleUrls: ['./workout-generator.scss'],
})
export class WorkoutGeneratorComponent implements OnInit {
    workout: Workout;
    constructor(
        private generator: WorkoutGenerator,
    ) {}
    ngOnInit(): void { }

    async generateWorkout() {
        this.workout = await this.generator.getRandomWorkout(
            [
                [
                    {kind: WorkoutKind.Legs, allowFluff: false},
                    {kind: WorkoutKind.Chest, allowFluff: false},
                ],
                [
                    {kind: WorkoutKind.Legs, allowFluff: false},
                    {kind: WorkoutKind.Back, allowFluff: false},
                ],
                [
                    {kind: WorkoutKind.Legs, allowFluff: false},
                    {kind: WorkoutKind.Shoulders, allowFluff: false},
                ],
                [
                    {kind: WorkoutKind.Arms, allowFluff: true},
                    {kind: WorkoutKind.Core, allowFluff: true},
                ],
            ]
        );
    }
}