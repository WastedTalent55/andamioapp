import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { Quote } from '../../../core/models/quote.model';
import { LucideAngularModule, Wallet, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-quote-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, LucideAngularModule],
  templateUrl: './quote-card.component.html',
  styleUrl: './quote-card.component.css'
})
export class QuoteCardComponent {
  Wallet = Wallet;
  Calendar = Calendar;

  @Input() quote!: Quote; // siempre viene enlazado desde quote-list, ver [quote]="quote" en su template

  private router = inject(Router);

  statusColor(status: string): 'blue' | 'green' | 'yellow' | 'gray' | 'red' {
    switch (status) {
      case 'aceptada': return 'green';
      case 'enviada': return 'blue';
      case 'rechazada': return 'red';
      default: return 'yellow'; // borrador
    }
  }

  openQuote() {
    this.router.navigate(['/quotes/preview', this.quote.id]);
  }
}