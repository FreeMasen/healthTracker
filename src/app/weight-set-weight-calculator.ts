import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
@Component({
    selector: 'weight-calculator',
    templateUrl: 'weight-set-weight-calculator.html',
    styleUrls: ['weight-set-weight-calculator.scss']
})
export class WeightCalculator {
    dumbbellForm = this.builder.group({
        weight: [0, Validators.min(1)],
        two: true,
    });
    barbellForm = this.builder.group({
        'barbell-side': [0, Validators.required],
        barbell: [45, Validators.min(1)],
    });

    constructor(
        public dialogRef: MatDialogRef<WeightCalculator>,
        @Inject(MAT_DIALOG_DATA)
        public data: {bodyWeight: number},
        private builder: FormBuilder
    ) {}


    useBodyWeight() {
        this.dialogRef.close({
            type: 'bodyWeight',
            weight: this.data.bodyWeight,
        });
    }

    useDumbbell() {
        const hand = this.dumbbellForm.get('weight').value || 0;
        this.dialogRef.close({
            type: 'dumbbell',
            hand,
        });
    }

    useBarbell() {
        const bb = this.barbellForm.get('barbell').value || 0;
        const side = this.barbellForm.get('barbell-side');
        console.log('useBarbell', bb, side);
        this.dialogRef.close({
            type: 'barbell',
            barbell: bb,
            side: side.value,
        });
    }
}
