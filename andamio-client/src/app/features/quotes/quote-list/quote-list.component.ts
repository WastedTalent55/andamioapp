import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuoteService } from '../../../core/services/quote.service';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { QuoteCardComponent } from '../../../shared/cards/quote-card/quote-card.component';
import { Quote } from '../../../core/models/quote.model';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    QuoteCardComponent
  ],
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.css'
})
export class QuoteListComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private router = inject(Router);

  quotes: Quote[] = [];
  filteredQuotes: Quote[] = [];

  // 🆕 Panel de "¿cómo quieres cotizar?" que se abre al pulsar Nueva cotización
  showStartOptions: boolean = false;

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.quoteService.getQuotes().subscribe({
      next: (response) => {
        this.quotes = response.data || [];
        this.filteredQuotes = this.quotes;
      },
      error: (err) => console.error('Error cargando cotizaciones', err)
    });
  }

  onSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();

    if (!filterValue) {
      this.filteredQuotes = this.quotes;
      return;
    }

    this.filteredQuotes = this.quotes.filter(quote =>
      quote.customer_name?.toLowerCase().includes(filterValue) ||
      String(quote.quote_folio).includes(filterValue)
    );
  }

  // KPIs rápidos para el encabezado, calculados sobre lo ya cargado (sin llamadas extra al backend)
  get totalCount(): number {
    return this.quotes.length;
  }

  get enviadasCount(): number {
    return this.quotes.filter(q => q.status === 'enviada').length;
  }

  get aceptadasCount(): number {
    return this.quotes.filter(q => q.status === 'aceptada').length;
  }

  get montoAceptado(): number {
    return this.quotes
      .filter(q => q.status === 'aceptada')
      .reduce((acc, q) => acc + Number(q.total_amount || 0), 0);
  }

  openStartOptions() {
    this.showStartOptions = true;
  }

  closeStartOptions() {
    this.showStartOptions = false;
  }

  // 🆕 Camino 1: cotizar a partir de una visita de evaluación (flujo normal)
  startFromEvaluation() {
    this.router.navigate(['/customer']);
  }

  // 🆕 Camino 2: cotizar directamente, eligiendo (o creando) un cliente sin pasar por evaluación
  startDirectQuote() {
    this.router.navigate(['/customer'], { queryParams: { mode: 'pick-for-quote' } });
  }
}