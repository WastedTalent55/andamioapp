import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quote, QuoteItem } from '../models/quote.model';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/quotes';

  createQuote(quoteData: Partial<Quote>): Observable<any> {
    return this.http.post(this.apiUrl, quoteData);
  }

  addItem(item: QuoteItem): Observable<any> {
    return this.http.post(`${this.apiUrl}/items`, item);
  }

  getQuoteById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateQuote(id: number, data: Partial<Quote>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  getQuoteByEvaluationId(evaluationId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/evaluation/${evaluationId}`);
}
}