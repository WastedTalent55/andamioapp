import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './evaluation-list.component.html'
})
export class EvaluationListComponent implements OnInit {
  private evaluationService = inject(EvaluationService);
  evaluations: any[] = [];

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations() {
    this.evaluationService.getEvaluations().subscribe({
      next: (res) => {
        this.evaluations = res.data;
      },
      error: (err) => console.error('Error al cargar evaluaciones:', err)
    });
  }
}