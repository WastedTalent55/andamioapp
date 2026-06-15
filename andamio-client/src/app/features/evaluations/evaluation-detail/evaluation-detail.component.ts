import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Evaluation } from '../../../core/models/evaluation.model';

@Component({
  selector: 'app-evaluation-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './evaluation-detail.component.html',
  styleUrls: ['./evaluation-detail.component.css']
})
export class EvaluationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private evaluationService = inject(EvaluationService);

  evaluationId!: number;
  evaluation?: Evaluation;
  notesForm: FormGroup;

  constructor() {
    this.notesForm = this.fb.group({
      // Este es el lienzo de texto libre
      notes: [''] 
    });
  }

  ngOnInit(): void {
    this.evaluationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvaluation();
  }

  loadEvaluation() {
    // Aquí implementaremos la carga de la evaluación para saber 
    // a qué cliente y qué trabajo (ej: Humedad en baño) nos referimos [6].
    this.evaluationService.getEvaluationById(this.evaluationId).subscribe({
      next: (res) => {
        this.evaluation = res.data;
        // Cargamos las notas previas si existen
        this.notesForm.patchValue({ notes: this.evaluation?.requirements });
      }
    });
  }

  saveNotes() {
    if (this.notesForm.valid) {
      const notesValue = this.notesForm.value.notes;
      
      // Enviamos el texto del lienzo al campo 'requirements' de la BD
      this.evaluationService.updateEvaluation(this.evaluationId, { requirements: notesValue })
        .subscribe({
          next: () => {
            alert('¡Notas guardadas! Ya son información accionable.');
          },
          error: (err) => console.error('Error en el circuito de guardado:', err)
        });
    }
  }
}