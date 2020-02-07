import { Injectable } from '@angular/core';
import { Data, IWorkoutShape, Workout, ExerciseSet, IExercise, Exercise, WorkoutKind } from './data';



@Injectable({
    providedIn: 'root',
})
export class WorkoutGenerator {
    constructor(
        private data: Data,
    ) {}
    public async getRandomWorkout(patterns: IWorkoutShape[][]): Promise<Workout> {
        const copy = await this.data.getAllWorkoutOptions();
        const ret = new Workout([]);
        for (const pat of patterns) {
            ret.sets.push(this.getRandomWorkoutSet(pat, copy, false));
        }
        return ret;
    }

    private getRandomWorkoutSet(pattern: IWorkoutShape[], exercises: IExercise[], allowFluff: boolean): ExerciseSet {
        const set = new ExerciseSet();
        for (const shape of pattern) {
            const ex = this.randomExercise(exercises, shape.kind, shape.allowFluff);
            set.add(ex);
        }
        return set;
    }

    private randomExercise(exercises: IExercise[], kind: WorkoutKind, allowFluff: boolean): Exercise {
        const indexes = [];
        for (let i = 0; i < exercises.length; i++) {
            if (exercises[i].kind === kind && allowFluff || !exercises[i].fluff) {
                indexes.push(i);
            }
        }
        const idxIdx = Math.floor(Math.random() * indexes.length);
        const idx = indexes[idxIdx];
        const ex = exercises.splice(indexes[idx], 1)[0];
        const reps = Math.floor(Math.random() * 15 - 8) + 8;
        return new Exercise(
            ex.name,
            ex.kind,
            reps,
            ex.fluff
        );
    }
}