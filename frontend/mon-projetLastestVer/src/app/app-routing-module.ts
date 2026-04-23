import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout-component/layout-component';
import { Home } from './home/home';
import { Back } from './back/back';
import { Hospitalisation } from './hospitalisation/hospitalisation';
import { DailyReport } from './daily-report/daily-report';
import {InfectionVaccinationComponent} from './infection-vaccination/infection-vaccination'
import { InfectionDashboardComponent } from './infection-dashboard/infection-dashboard';
import { GraftFunctionComponent } from './graft-function/graft-function';

const routes: Routes = [

  // Route par défaut
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Page simple
  { path: 'home', component: Home },

  // Pages avec Layout (sidebar + navbar)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'back', component: Back },
      { path: 'hospitalisation', component: Hospitalisation },
      { path: 'daily-report', component: DailyReport },
      { path: 'infection', component: InfectionVaccinationComponent },
      { path: 'infection-dashboard', component: InfectionDashboardComponent },
      { path: 'graff-func', component: GraftFunctionComponent }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }