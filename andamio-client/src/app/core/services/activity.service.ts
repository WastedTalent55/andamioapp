import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

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
  private apiUrl = 'http://localhost:3000/api/activity';

  getRecent(limit: number = 6): Observable<ApiResponse<ActivityItem[]>> {
    return this.http.get<ApiResponse<ActivityItem[]>>(`${this.apiUrl}/recent?limit=${limit}`);
  }
}