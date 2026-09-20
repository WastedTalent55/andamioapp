import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectFormData } from '../models/project.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment'; 

export interface ProjectStats {
  total: number;
  activo: number;
  pausado: number;
  finalizado: number;
  cancelado: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  createFromQuote(quoteId: number, data: ProjectFormData): Observable<ApiResponse<{ projectId: number }>> {
    return this.http.post<ApiResponse<{ projectId: number }>>(`${this.apiUrl}/from-quote/${quoteId}`, data);
  }

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl);
  }

  getProjectById(id: number): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: number, data: Partial<Project>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/${id}`, data);
  }

  getProjectStats(): Observable<ApiResponse<ProjectStats>> {
    return this.http.get<ApiResponse<ProjectStats>>(`${this.apiUrl}/count`);
  }
}