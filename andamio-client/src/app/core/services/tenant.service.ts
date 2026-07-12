import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/tenants';

  updateTenant(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}