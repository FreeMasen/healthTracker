import { NgModule } from '@angular/core';
import {
    MatToolbarModule, MatButtonModule, 
    MatIconModule, MatMenuModule, 
    MatInputModule, MatFormFieldModule,
    MatSnackBarModule, MatProgressBarModule,
    MatCardModule, MatListModule, MatTreeModule,
    MatSelectModule, MatTableModule, 
    MatStepperModule, MatDatepickerModule,
    MatProgressSpinnerModule,
} from '@angular/material';
import { MatMomentDateModule, } from '@angular/material-moment-adapter';

@NgModule({
    exports: [
        MatToolbarModule, MatButtonModule, 
        MatIconModule, MatMenuModule, 
        MatInputModule, MatFormFieldModule,
        MatSnackBarModule, MatProgressBarModule,
        MatCardModule, MatListModule,
        MatTreeModule, MatSelectModule,
        MatTableModule, MatStepperModule,
        MatDatepickerModule, MatMomentDateModule,
        MatProgressSpinnerModule,
    ],
    imports: [],

})
export class MaterialModule {}