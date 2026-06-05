import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer.model';

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

  createCustomer(customer: Customer): Observable<any> {
    return this.http.post<any>(this.apiUrl, customer);
  }
}