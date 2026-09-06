import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quote, QuoteItem, QuoteVersionHistoryEntry } from '../models/quote.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../enviroments/environment';

export interface QuoteStats {
  total: number;
  borrador: number;
  enviada: number;
  aceptada: number;
  rechazada: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/quotes`;

  createQuote(quoteData: Partial<Quote>): Observable<ApiResponse<{ quoteId: number }>> {
    return this.http.post<ApiResponse<{ quoteId: number }>>(this.apiUrl, quoteData);
  }

  getQuotes(): Observable<ApiResponse<Quote[]>> {
    return this.http.get<ApiResponse<Quote[]>>(this.apiUrl);
  }

  addItem(item: QuoteItem): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/items`, item);
  }

  getQuoteById(id: number): Observable<ApiResponse<Quote & { items: QuoteItem[] }>> {
    return this.http.get<ApiResponse<Quote & { items: QuoteItem[] }>>(`${this.apiUrl}/${id}`);
  }

  updateQuote(id: number, data: Partial<Quote>): Observable<ApiResponse<{ quoteId: number; versioned: boolean }>> {
    return this.http.put<ApiResponse<{ quoteId: number; versioned: boolean }>>(`${this.apiUrl}/${id}`, data);
  }

  updateQuoteStatus(id: number, status: string): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.apiUrl}/${id}/status`, { status });
  }

  getQuoteHistory(id: number): Observable<ApiResponse<QuoteVersionHistoryEntry[]>> {
    return this.http.get<ApiResponse<QuoteVersionHistoryEntry[]>>(`${this.apiUrl}/${id}/history`);
  }

  getQuoteByEvaluationId(evaluationId: number): Observable<ApiResponse<Quote & { items: QuoteItem[] }>> {
    return this.http.get<ApiResponse<Quote & { items: QuoteItem[] }>>(`${this.apiUrl}/evaluation/${evaluationId}`);
  }

  getQuoteStats(): Observable<ApiResponse<QuoteStats>> {
    return this.http.get<ApiResponse<QuoteStats>>(`${this.apiUrl}/count`);
  }

  deleteQuote(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`);
  }
}