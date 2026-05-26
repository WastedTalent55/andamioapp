import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ApiResponse {
  success: boolean;
  data: Customer[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/customers';

  getCustomers(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }
}