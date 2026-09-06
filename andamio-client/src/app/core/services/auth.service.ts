import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment'; 

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Método para enviar el token de Google al Backend
  loginWithGoogle(googleToken: string) {
    return this.http.post<any>(`${this.apiUrl}/google`, { token: googleToken }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('andamio_token', response.token);
          localStorage.setItem('tenant_id', response.tenant_id);
          localStorage.setItem('andamio_user_name', response.user_name);
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('andamio_token');
  }

  // Método para salir y cerrar el andamio
  logout() {
    localStorage.removeItem('andamio_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('andamio_user_name');
  }
}