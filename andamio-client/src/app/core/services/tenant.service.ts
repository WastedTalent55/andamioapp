import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenants`;

  private tenantNameSubject = new BehaviorSubject<string>('Andamio');
  tenantName$ = this.tenantNameSubject.asObservable(); 

  emitNewName(name: string) {
    this.tenantNameSubject.next(name);
  }

  // 🆕 Nombre del admin de la cuenta — separado del nombre de la empresa.
  // Arranca con lo que ya había en localStorage (seteado al hacer login),
  // y se actualiza en vivo cuando se guarda en Configuración, sin recargar.
  private userNameSubject = new BehaviorSubject<string>(localStorage.getItem('andamio_user_name') || '');
  userName$ = this.userNameSubject.asObservable();

  emitNewUserName(name: string) {
    this.userNameSubject.next(name);
    localStorage.setItem('andamio_user_name', name);
  }

  getMyTenantConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config`).pipe(
      tap((res: any) => {
        if (res.success && res.data && res.data.company_name) {
          this.emitNewName(res.data.company_name);
        }
        if (res.success && res.data && res.data.owner_name) {
          this.emitNewUserName(res.data.owner_name);
        }
      })
    );
  }

  saveTenantProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update`, data).pipe(
      tap((res: any) => {
        if (res.success && data.company_name) {
          this.emitNewName(data.company_name);
        }
        if (res.success && data.owner_name) {
          this.emitNewUserName(data.owner_name);
        }
      })
    );
  }
}