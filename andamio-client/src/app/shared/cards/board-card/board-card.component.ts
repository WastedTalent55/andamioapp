import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { LucideAngularModule, MapPin, Phone, Wallet, Calendar, FileText, CircleCheck, Clock, Eye, Pencil, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './board-card.component.html',
  styleUrl: './board-card.component.css'
})
export class BoardCardComponent {
  MapPin = MapPin;
  Phone = Phone;
  Wallet = Wallet;
  Calendar = Calendar;
  FileText = FileText;
  CircleCheck = CircleCheck;
  Clock = Clock;
  Eye = Eye
  Pencil = Pencil;
  Trash2 = Trash2;

  @Input() data: any;
  @Input() customer!: Customer;
  
  // evaluations
  // quoting
  // customers

  @Input() type: string = 'evaluations';

  // 🆕 Avisa al padre (project-board) que algo se borró, para refrescar el tablero
  @Output() cardDeleted = new EventEmitter<void>();

  private router = inject(Router);
  private evaluationService = inject(EvaluationService);

  deleting = false;

  openNotes() {
    const evalId = this.data.eval_id;

    if (evalId) {
      this.router.navigate(['/evaluations', evalId, 'details']);
    } else {
      console.error('No se encontró el ID de la evaluación para abrir las notas');
    }

  }

  editEvaluation(event: Event) {
    event.stopPropagation();
    if (this.data.eval_id) {
      this.router.navigate(['/evaluations', this.data.eval_id, 'edit']);
    }
  }

  deleteEvaluation(event: Event) {
    event.stopPropagation();

    if (!this.data.eval_id || this.deleting) return;

    const confirmDelete = confirm(
      `¿Eliminar la evaluación de ${this.data.customer_name}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    this.deleting = true;

    this.evaluationService.deleteEvaluation(this.data.eval_id).subscribe({
      next: () => {
        this.deleting = false;
        this.cardDeleted.emit();
      },
      error: (err) => {
        this.deleting = false;

        if (err.status === 409) {
          alert(`⚠️ ${err.error?.message || 'Esta evaluación tiene una cotización asociada y no se puede eliminar.'}`);
          return;
        }

        console.error('Error eliminando evaluación:', err);
        alert('❌ No se pudo eliminar la evaluación.');
      }
    });
  }

  viewDetail() {
    const route = this.type === 'evaluations' 
      ? `/evaluations/edit/${this.data.eval_id}` 
      : `/quotes/preview/${this.data.quote_id}`;
    this.router.navigateByUrl(route);
  }

  viewPreview() {
    if (this.data.quote_id) {
      this.router.navigate(['/quotes/preview', this.data.quote_id]);
    }
}

acceptQuote() {
    const confirmAction = confirm(`¿Confirmas que la cotización de ${this.data.customer_name} ha sido aceptada?`);
    if (confirmAction) {
      this.router.navigate(['/projects/new', this.data.quote_id]);
    }
  }
}