import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from './material.module';

import { MessageComponent } from './message-component';
import { AppComponent } from './app.component';
import { SearchComponent } from './search-component';
import { SeederComponent, StatePipe, TableNamePipe } from './seeder.component';
import { DashboardComponent } from './dashboard.component';
import { FoodDetails } from './food-details.component';
import { PersonalInfoComponent } from './personal-info.component';
import { AddMealComponent } from './add-meal.component';

@NgModule({
    declarations: [
        MessageComponent,
        AppComponent,
        SearchComponent,
        SeederComponent,
        DashboardComponent,
        StatePipe,
        TableNamePipe,
        FoodDetails,
        PersonalInfoComponent,
        AddMealComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        MaterialModule,
        ReactiveFormsModule
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
