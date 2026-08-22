import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { LucideAngularModule, MapPin, Phone, Wallet, Calendar, FileText, CircleCheck, Clock, Eye } from 'lucide-angular';

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

  @Input() data: any;
  @Input() customer!: Customer;
  
  // evaluations
  // quoting
  // customers

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
      this.router.navigate(['/projects/new', this.data.quote_id]);
    }
  }
}