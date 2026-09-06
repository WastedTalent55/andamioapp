import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { RouterModule } from '@angular/router';
import { Evaluation } from '../../../core/models/evaluation.model';
import { LucideAngularModule, ClipboardList, Phone, MapPin, Pencil } from 'lucide-angular';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './evaluation-list.component.html'
})
export class EvaluationListComponent implements OnInit {
  ClipboardList = ClipboardList;
  Phone = Phone;
  MapPin = MapPin;
  Pencil = Pencil;
  private evaluationService = inject(EvaluationService);
  evaluations:  Evaluation[] = []; 

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations() {
    this.evaluationService.getEvaluations().subscribe({
      next: (res) => {
        this.evaluations = res.data || [];
      },
      error: (err) => console.error('Error al cargar evaluaciones:', err)
    });
  }
}