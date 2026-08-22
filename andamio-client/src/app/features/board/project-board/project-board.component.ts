import { Component, OnInit, inject } from '@angular/core';
import { ProjectBoardService, BoardSummary } from '../../../core/services/project-board.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { BoardColumnComponent } from "../board-column/board-column.component";

const EMPTY_BOARD: BoardSummary = {
  evaluations: [],
  quoting: [],
  active: [],
  finished: []
};

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

  columns: BoardSummary = { ...EMPTY_BOARD };

  createCustomer() {
  this.router.navigate(['/customer/new']);
  }

  createEvaluation() {
this.router.navigate(['/evaluations/new']);
}

createQuote() {
  this.router.navigate(['/quotes/new']);
}

createProject() {
  this.router.navigate(['/project/new']);
}

  ngOnInit() {
    this.loadBoard();
  }

  loadBoard() {
  this.boardService.getBoardData().subscribe(res => {
    if (res.success && res.data) {
      this.columns = res.data;
    }
  });
}

  refreshBoard() {
  this.boardService.getBoardData().subscribe(res => {
    if (res.success && res.data) {
      this.columns = res.data;
    }
  });
}
}