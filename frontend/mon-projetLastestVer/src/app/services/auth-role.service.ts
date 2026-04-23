import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';

export interface PatientUser {
  username: string;
  displayName: string;
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  private readonly GATEWAY = 'http://localhost:8095';

  constructor(
    private keycloak: KeycloakService,
    private http: HttpClient
  ) {}

  isMedecin(): boolean { return this.keycloak.isUserInRole('medecin'); }
  isPatient(): boolean { return this.keycloak.isUserInRole('patient'); }

getUsername(): string {
  try {
    // tokenParsed is available immediately after login — preferred_username
    // is the Keycloak username (e.g. "john_doe"), always present on the token
    const token = this.keycloak.getKeycloakInstance().tokenParsed;
    return (token?.['preferred_username'] ?? token?.['sub'] ?? '').toString();
  } catch {
    return '';
  }
}

getPatientIdentifier(): string {
  return this.getUsername();
}

  getPatientUsers(): Observable<PatientUser[]> {
    return this.http.get<PatientUser[]>(`${this.GATEWAY}/api/patients/details`);
  }

  logout(): void {
    this.keycloak.logout('http://localhost:4200/home');
  }
  getToken(): Promise<string> {
  return this.keycloak.getToken();
}
}