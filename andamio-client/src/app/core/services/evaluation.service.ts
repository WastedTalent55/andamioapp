import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation } from '../models/evaluation.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../enviroments/environment.production';

export interface EvaluationStats {
  total: number;
  pendiente: number;
  realizada: number;
  cancelada: number;
}

@Injectable({
  providedIn: 'root'
})

export class EvaluationService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/evaluations`;

  createEvaluation(evaluation: Partial<Evaluation>): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(this.apiUrl, evaluation);
  }

  getEvaluations(): Observable<ApiResponse<Evaluation[]>> {
    return this.http.get<ApiResponse<Evaluation[]>>(this.apiUrl);
  }

  updateEvaluation(id: number, data: { requirements: string }): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/${id}`, data);
  }

  getEvaluationById(id: number): Observable<ApiResponse<Evaluation>> {
    return this.http.get<ApiResponse<Evaluation>>(`${this.apiUrl}/${id}`);
  }

  getEvaluationCount(): Observable<ApiResponse<EvaluationStats>> {
    return this.http.get<ApiResponse<EvaluationStats>>(`${this.apiUrl}/count`);
  }

  updateEvaluationDetails(id: number, data: Partial<Evaluation>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/${id}/details`, data);
  }

  deleteEvaluation(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`);
  }

  getEvaluationsWithoutQuote(): Observable<ApiResponse<Evaluation[]>> {
    return this.http.get<ApiResponse<Evaluation[]>>(`${this.apiUrl}/without-quote`);
  }
}