import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Evaluation } from '../../../core/models/evaluation.model';
import { Customer } from '../../../core/models/customer.model';
import { LucideAngularModule, X, ClipboardList, Zap, Search, UserPlus } from 'lucide-angular';

type Step = 'choose' | 'pick-evaluation' | 'pick-customer';

@Component({
  selector: 'app-new-quote-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './new-quote-modal.component.html', 
  styleUrl: './new-quote-modal.component.css'
})
export class NewQuoteModalComponent {
  X = X;
  ClipboardList = ClipboardList;
  Zap = Zap;
  Search = Search;
  UserPlus = UserPlus;

  @Output() closed = new EventEmitter<void>();

  private evaluationService = inject(EvaluationService);
  private customerService = inject(CustomerService);
  private router = inject(Router);

  step: Step = 'choose';
  loading = false;

  // --- Desde una evaluación ---
  evaluationsWithoutQuote: Evaluation[] = [];
  filteredEvaluations: Evaluation[] = [];
  evaluationSearchTerm = '';

  // --- Cotizar directamente ---
  allCustomers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  customerSearchTerm = '';

  close() {
    this.closed.emit();
  }

  // Evita que un clic dentro de la tarjeta cierre el modal (el backdrop sí lo cierra)
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  goToChoose() {
    this.step = 'choose';
  }

  // ============ Camino 1: Desde una evaluación ============

  openEvaluationPicker() {
    this.step = 'pick-evaluation';
    this.loading = true;
    this.evaluationSearchTerm = '';

    this.evaluationService.getEvaluationsWithoutQuote().subscribe({
      next: (res) => {
        this.evaluationsWithoutQuote = res.data || [];
        this.filteredEvaluations = this.evaluationsWithoutQuote;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando evaluaciones sin cotización:', err);
        this.loading = false;
      }
    });
  }

  onSearchEvaluations(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.evaluationSearchTerm = term;

    if (!term) {
      this.filteredEvaluations = this.evaluationsWithoutQuote;
      return;
    }

    this.filteredEvaluations = this.evaluationsWithoutQuote.filter(ev =>
      ev.customer_name?.toLowerCase().includes(term) ||
      ev.requested_work?.toLowerCase().includes(term)
    );
  }

  pickEvaluation(evaluation: Evaluation) {
    this.closed.emit();
    this.router.navigate(['/evaluations', evaluation.id, 'create-quote']);
  }

  // ============ Camino 2: Cotizar directamente ============

  openCustomerPicker() {
    this.step = 'pick-customer';
    this.loading = true;
    this.customerSearchTerm = '';
    this.filteredCustomers = [];

    this.customerService.getCustomers().subscribe({
      next: (res) => {
        this.allCustomers = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.loading = false;
      }
    });
  }

  onSearchCustomers(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.customerSearchTerm = term;

    if (!term) {
      this.filteredCustomers = [];
      return;
    }

    this.filteredCustomers = this.allCustomers.filter(c =>
      `${c.first_name} ${c.last_name || ''}`.toLowerCase().includes(term)
    );
  }

  pickCustomer(customer: Customer) {
    this.closed.emit();
    this.router.navigate(['/quotes/new/customer', customer.id]);
  }

  createNewCustomer() {
    this.closed.emit();
    // customer-form ya sabe qué hacer con intent=quote: al guardar,
    // te manda directo al formulario de cotización con el cliente recién creado.
    this.router.navigate(['/customer/new'], { queryParams: { intent: 'quote' } });
  }

  get showNoMatches(): boolean {
    return this.customerSearchTerm.length > 0 && !this.loading && this.filteredCustomers.length === 0;
  }
}