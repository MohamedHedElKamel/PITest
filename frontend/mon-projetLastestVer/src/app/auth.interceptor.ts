import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return from(this.keycloak.getToken()).pipe(
      switchMap(token => {
        const cloned = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;
        return next.handle(cloned);
      })
    );
  }
}