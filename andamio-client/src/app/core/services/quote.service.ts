import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quote, QuoteItem, QuoteVersionHistoryEntry } from '../models/quote.model';
import { ApiResponse } from '../models/api-response.model';

export interface QuoteStats {
  total: number;
  borrador: number;
  enviada: number;
  aceptada: number;
  rechazada: number;
}

// ⚠️ A diferencia del resto de endpoints, createQuote y updateQuote NO envuelven
// su payload en `data` — el backend los devuelve "planos" (quoteId al nivel raíz).
// Se tipan aparte para no mentir sobre la forma real de la respuesta.
export interface CreateQuoteResponse {
  success: boolean;
  message?: string;
  quoteId: number;
}

export interface UpdateQuoteResponse {
  success: boolean;
  message?: string;
  versioned: boolean;
  quoteId: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/quotes';

  createQuote(quoteData: Partial<Quote>): Observable<CreateQuoteResponse> {
    return this.http.post<CreateQuoteResponse>(this.apiUrl, quoteData);
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

  updateQuote(id: number, data: Partial<Quote>): Observable<UpdateQuoteResponse> {
    return this.http.put<UpdateQuoteResponse>(`${this.apiUrl}/${id}`, data);
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
}