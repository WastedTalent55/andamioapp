import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectBoardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/board';

  getBoardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }
}