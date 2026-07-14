import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject,  Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/tenants';

  private tenantNameSubject = new BehaviorSubject<string>('Andamio');
  tenantName$ = this.tenantNameSubject.asObservable(); 

  emitNewName(name: string) {
    this.tenantNameSubject.next(name);
  }

  updateTenant(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  getTenantData(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

   saveTenantProfile(data: any) {
   return this.http.post(`${this.apiUrl}/update`, data);
  }
}