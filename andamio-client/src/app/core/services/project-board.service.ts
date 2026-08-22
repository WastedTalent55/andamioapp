import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

// Una fila del board puede ser una evaluación pura, una cotización, o un
// proyecto — según la columna, distintos campos vienen o no. Se modela como
// una unión flexible en vez de forzar un tipo estricto que hoy no representa
// bien la query de UNION del backend (ver boardModel.js).
export interface BoardRow {
  eval_id?: number | null;
  eval_date?: string | null;
  requested_work?: string | null;
  requirements?: string | null;
  evaluation_status?: 'pendiente' | 'realizada' | 'cancelada' | null;

  quote_id?: number | null;
  quote_status?: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | null;
  total_amount?: number;
  version_number?: number;

  project_id?: number | null;
  project_name?: string | null;
  project_status?: 'activo' | 'pausado' | 'finalizado' | 'cancelado' | null;
  project_start_date?: string | null;

  customer_name?: string;
  customer_address?: string;
  phone?: string;
  created_at?: string;
}

export interface BoardSummary {
  evaluations: BoardRow[];
  quoting: BoardRow[];
  active: BoardRow[];
  finished: BoardRow[];
}

@Injectable({ providedIn: 'root' })
export class ProjectBoardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/board';

  getBoardData(): Observable<ApiResponse<BoardSummary>> {
    return this.http.get<ApiResponse<BoardSummary>>(`${this.apiUrl}/summary`);
  }
}