import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Evaluation } from '../../../core/models/evaluation.model';
import { Router } from '@angular/router';

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
  private router= inject(Router);

  evaluationId!: number;
  evaluation?: Evaluation;
  notesForm: FormGroup;

  constructor() {
    this.notesForm = this.fb.group({
      notes: [''] 
    });
  }

  ngOnInit(): void {
    this.evaluationId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.evaluationId) {
      this.loadEvaluation();
    }
  }

  loadEvaluation(): void {
    this.evaluationService.getEvaluationById(this.evaluationId).subscribe({
      next: (data) => {
        console.log('Jefe, esto es lo que llega:', data); 

        if (data) {
          this.evaluation = data; 

          this.notesForm.patchValue({
            notes: data.requirements || '' 
          });
                console.log('✅ Datos cargados para:', data.first_name);

          console.log('Notas inyectadas al lienzo:', data.requirements);
        }
      },
      error: (err) => console.error('Error de conexión en el andamio:', err)
    });
  }

  saveNotes() {
    if (this.notesForm.valid) {
      const notesValue = this.notesForm.value.notes;
      
      this.evaluationService.updateEvaluation(this.evaluationId, { requirements: notesValue })
        .subscribe({
          next: () => {
            alert('¡Notas guardadas!');
            this.router.navigate(['/board']);
          },
          error: (err) => console.error('Error en el circuito de guardado:', err)
        });
    }
  }
}