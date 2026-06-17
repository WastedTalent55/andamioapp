import { Component, OnInit, inject } from '@angular/core';
import { ProjectBoardService } from '../../../core/services/project-board.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.css'
})
export class ProjectBoardComponent implements OnInit {
  private boardService = inject(ProjectBoardService);
  
  columns: any = {
    evaluations: [],
    quoting: [],
    active: [],
    finished: []
  };

  ngOnInit() {
    this.loadBoard();
  }

  loadBoard() {
  this.boardService.getBoardData().subscribe(res => {
    console.log('Lo que llega del server:', res); // 👈 Revisa esto en la consola del F12
    if (res.success) {
      // Debemos asignar 'res.data', no solo 'res'
      this.columns = res.data; 
    }
  });
}

  refreshBoard() {
  this.boardService.getBoardData().subscribe(res => {
    console.log('Datos recibidos del server:', res); // 👈 AÑADE ESTO
    if (res.success) {
      this.columns = res.data;
    }
  });
}
}
