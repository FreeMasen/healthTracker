import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchComponent  } from './search-component';
import { SeederComponent } from './seeder.component';
import { DashboardComponent } from './dashboard.component';
import { FoodDetails } from './food-details.component';
import { PersonalInfoComponent } from './personal-info.component';
import { AddMealComponent } from './add-meal.component';
import { AboutComponent } from './about.component';
const routes: Routes = [
  {path: '', component: DashboardComponent },
  {path: 'search', component: SearchComponent},
  {path: 'seed', component: SeederComponent},
  {path: 'food/:id', component: FoodDetails},
  {path: 'personal-info/add', component: PersonalInfoComponent},
  {path: 'meal/add', component: AddMealComponent},
  {path: 'about', component: AboutComponent},
  {path: '**', redirectTo: ''},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false }), ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
