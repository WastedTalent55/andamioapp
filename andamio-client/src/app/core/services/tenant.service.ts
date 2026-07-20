import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/tenants';

  private tenantNameSubject = new BehaviorSubject<string>('Andamio');
  tenantName$ = this.tenantNameSubject.asObservable(); 

  emitNewName(name: string) {
    this.tenantNameSubject.next(name);
  }

  getMyTenantConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config`).pipe(
      tap((res: any) => {
        if (res.success && res.data && res.data.company_name) {
          this.emitNewName(res.data.company_name);
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
      })
    );
  }
}