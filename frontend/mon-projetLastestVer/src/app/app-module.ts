import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

import { App } from './app';
import { Home } from './home/home';
import { Back } from './back/back';
import { Sidebar } from './sidebar/sidebar';
import { LayoutComponent } from './layout-component/layout-component';
import { Navbar2 } from './navbar2/navbar2';
import { Hospitalisation } from './hospitalisation/hospitalisation';
import { DailyReport } from './daily-report/daily-report';
import { StatsComponent } from './stats/stats';
import { GraftFunctionComponent } from './graft-function/graft-function';
import { AuthInterceptor } from './auth.interceptor'; // adjust path
import { keycloakConfig } from './keycloak.config';   // adjust path

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init(keycloakConfig);
}

@NgModule({
  declarations: [
    App,
    Home,
    Back,
    Sidebar,
    LayoutComponent,
    Navbar2,
    Hospitalisation,
    DailyReport,
    StatsComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    KeycloakAngularModule,      // ← add this
    GraftFunctionComponent,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App]
})
export class AppModule { }