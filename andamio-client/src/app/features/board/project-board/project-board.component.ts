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
    if (res.success) {
      this.columns = res.data; 
    }
  });
}

  refreshBoard() {
  this.boardService.getBoardData().subscribe(res => {
    if (res.success) {
      this.columns = res.data;
    }
  });
}
}
