import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation } from '../models/evaluation.model';

@Injectable({
  providedIn: 'root'
})

export class EvaluationService {
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:3000/api/evaluations';

  createEvaluation(evaluation: Evaluation): Observable<any> {
    return this.http.post<any>(this.apiUrl, evaluation);
  }

  getEvaluations(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
