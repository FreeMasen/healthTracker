import { NgModule } from '@angular/core';
import {
    MatToolbarModule, MatButtonModule,
    MatIconModule, MatMenuModule,
    MatInputModule, MatFormFieldModule,
    MatSnackBarModule, MatProgressBarModule,
    MatCardModule, MatListModule, MatTreeModule,
    MatSelectModule, MatTableModule,
    MatStepperModule, MatDatepickerModule,
    MatProgressSpinnerModule, MatAutocompleteModule,
    MatTabsModule,
    MatSlideToggleModule,
} from '@angular/material';
import { MatMomentDateModule, } from '@angular/material-moment-adapter';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';

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
        MatProgressSpinnerModule, MatAutocompleteModule,
        MatButtonToggleModule, MatExpansionModule,
        MatTabsModule, MatSlideToggleModule,
    ],
    imports: [],

})
export class MaterialModule {}
