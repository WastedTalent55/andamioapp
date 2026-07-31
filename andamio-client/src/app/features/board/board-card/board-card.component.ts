import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-card.component.html',
  styleUrl: './board-card.component.css'
})
export class BoardCardComponent {
  @Input() data: any;
  @Input() type: string = 'evaluations';
  private router = inject(Router);

  openNotes() {
    const evalId = this.data.eval_id;

    if (evalId) {
      this.router.navigate(['/evaluations', evalId, 'details']);
    } else {
      console.error('No se encontró el ID de la evaluación para abrir las notas');
    }

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
      console.log('Cambiando estado a Aceptado para:', this.data.quote_id);
      // Aquí llamarías a tu servicio: this.quoteService.updateStatus(this.data.quote_id, 'accepted')...
    }
  }
}