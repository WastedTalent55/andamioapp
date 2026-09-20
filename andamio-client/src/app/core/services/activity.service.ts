import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment'; 

export interface ActivityItem {
  type: 'evaluation' | 'quote' | 'project';
  title: string;
  subtitle: string;
  color: 'blue' | 'yellow' | 'green' | 'red';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/activity`;

  getRecent(limit: number = 6): Observable<ApiResponse<ActivityItem[]>> {
    return this.http.get<ApiResponse<ActivityItem[]>>(`${this.apiUrl}/recent?limit=${limit}`);
  }
}