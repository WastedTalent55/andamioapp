import { Component, OnInit, inject } from '@angular/core';
import { ProjectBoardService } from '../../../core/services/project-board.service';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { BoardColumnComponent } from "../board-column/board-column.component";

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, BoardColumnComponent],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.css'
})

export class ProjectBoardComponent implements OnInit {
  constructor(
  private router: Router
  ) {}
  private boardService = inject(ProjectBoardService);
  
  columns: any = {
    evaluations: [],
    quoting: [],
    active: [],
    finished: []
  };

  createCustomer() {
  this.router.navigate(['/customer/new']);
  }

  createEvaluation() {
this.router.navigate(['/evaluation/new']);
}

  ngOnInit() {
    this.loadBoard();
  }

  loadBoard() {
  this.boardService.getBoardData().subscribe(res => {
console.log(res.data.quoting[0]);
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
