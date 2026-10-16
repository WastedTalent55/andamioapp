import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Customer } from '../../../core/models/customer.model';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, X, ClipboardList, TriangleAlert, Pencil } from 'lucide-angular';
import { CustomerFormComponent } from '../../customers/customer-form/customer-form.component';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, CustomerFormComponent],
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.css'
})

export class EvaluationFormComponent implements OnInit {
  X = X;
  ClipboardList = ClipboardList;
  TriangleAlert = TriangleAlert;
  Pencil = Pencil;

  private location = inject(Location);
  private fb = inject(FormBuilder);
  private router = inject(Router); 
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private evaluationService = inject(EvaluationService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('customerDialog', { static: true }) customerDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('customerSearch', { static: true }) customerSearch!: ElementRef<HTMLInputElement>;
  @ViewChild('modalCustomerForm') modalCustomerForm?: CustomerFormComponent;
  customerModalOpen = false;
  loadingCustomers = false;
  loadingEvaluation = false;
  customerLoadError = '';
  submitting = false;
  submitError = '';

  customers: Customer[] = []; 
  filteredAddresses: Array<{ id: number; full_address?: string }> = [];
  evaluationForm: FormGroup;

  searchTerm: string = '';
  showResults: boolean = false;
  filteredCustomers: Customer[] = [];
  activeCustomerIndex = -1;

  get customerSuggestionsOpen(): boolean {
    return this.showResults && !!this.searchTerm.trim() && !this.loadingCustomers && !this.loadingEvaluation && !this.customerLoadError;
  }

  get activeCustomerOptionId(): string | null {
    const customer = this.filteredCustomers[this.activeCustomerIndex];
    return this.customerSuggestionsOpen && customer ? `evaluation-customer-option-${customer.id}` : null;
  }

  isEditMode = false;
  evaluationId?: number;

  constructor() {
    this.evaluationForm = this.fb.group({
      customer_id: ['', [Validators.required]], 
      address_id: ['', Validators.required],
      scheduled_date_date: ['', [Validators.required]],
      scheduled_date_time: ['', [Validators.required]],
      evaluation_cost: [null, [Validators.min(0)]], 
      requested_work: ['', [Validators.required, Validators.maxLength(255)]],
      requirements: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.evaluationId = Number(idParam);
      this.loadingEvaluation = true;
      // Keep the initial response from overwriting edits made during loading.
      this.evaluationForm.disable({ emitEvent: false });
    }
    this.loadCustomers();
  }

  loadCustomers(): void {
    if (this.loadingCustomers) return;
    this.loadingCustomers = true;
    this.customerLoadError = '';
    this.filteredCustomers = [];
    this.activeCustomerIndex = -1;
    this.customerService.getCustomers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { 
        this.loadingCustomers = false;
        this.customers = res.data || [];
        this.filterCustomerSuggestions();

        if (this.isEditMode && this.evaluationId !== undefined) {
          this.loadEvaluation(this.evaluationId);
          return;
        }

        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
          const clientId = params['clientId'];
          if (clientId) {
            const customer = this.customers.find(c => c.id === Number(clientId));
            if (customer) {
              this.selectCustomer(customer);
            }
          }
        });
      },
      error: () => {
        this.loadingCustomers = false;
        this.customerLoadError = 'No se pudieron cargar los clientes. Reintenta para buscar o agregar un cliente.';
      }
    });
  }

  private loadEvaluation(id: number) {
    this.evaluationService.getEvaluationById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const evaluation: any = res.data;
        if (!evaluation) return;

        const customer = this.customers.find(c => c.id == evaluation.customer_id);
        if (customer) {
          this.searchTerm = this.customerName(customer);
          this.filteredAddresses = this.addressesForCustomer(customer);
        }

        if (evaluation.address_id && !this.filteredAddresses.some(address => address.id === evaluation.address_id)) {
          this.filteredAddresses.push({ id: evaluation.address_id, full_address: evaluation.address });
        }

        // <input type="date"> espera "YYYY-MM-DD" y <input type="time"> espera "HH:mm" —
        // partimos el ISO que regresa el backend (ej. "2026-09-20T14:30:00.000Z") en dos.
        const isoDate = evaluation.scheduled_date ? String(evaluation.scheduled_date) : '';
        const scheduledDateDate = isoDate ? isoDate.slice(0, 10) : '';
        const scheduledDateTime = isoDate ? isoDate.slice(11, 16) : '';

        this.evaluationForm.patchValue({
          customer_id: evaluation.customer_id,
          address_id: evaluation.address_id,
          scheduled_date_date: scheduledDateDate,
          scheduled_date_time: scheduledDateTime,
          evaluation_cost: evaluation.evaluation_cost,
          requested_work: evaluation.requested_work,
          requirements: evaluation.requirements
        });
        this.evaluationForm.enable({ emitEvent: false });
        this.loadingEvaluation = false;
      },
      error: (err) => {
        console.error('Error cargando la evaluación:', err);
        alert('❌ No se pudo cargar la evaluación.');
        this.location.back();
      }
    });
  }
  
  // El backend sigue esperando un solo campo scheduled_date — aquí recombinamos
  // los dos campos del formulario (fecha + hora) justo antes de enviar.
  private buildPayload() {
    const { scheduled_date_date, scheduled_date_time, ...rest } = this.evaluationForm.value;
    return {
      ...rest,
      scheduled_date: `${scheduled_date_date}T${scheduled_date_time}`
    };
  }

  onSubmit(): void {
    if (this.loadingEvaluation || this.submitting) return;
    this.evaluationForm.markAllAsTouched();
    if (!this.evaluationForm.valid) return;
    this.submitting = true;
    this.submitError = '';

    const payload = this.buildPayload();

    if (this.isEditMode && this.evaluationId) {
      this.evaluationService.updateEvaluationDetails(this.evaluationId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.submitting = false;
          alert('✅ Evaluación actualizada con éxito');
          this.router.navigate(['/board']);
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = 'No se pudo actualizar la evaluación. Tus datos se conservan; inténtalo de nuevo.';
        }
      });
      return;
    }

    this.evaluationService.createEvaluation(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.submitting = false;
        alert('✅ Visita técnica agendada con éxito');
        this.router.navigate(['/board']);
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'No se pudo agendar la visita. Tus datos se conservan; inténtalo de nuevo.';
      }
    });
  }

  onCustomerChange(event: any) {
    const customerId = event.target.value;
    const selectedCustomer = this.customers.find(c => c.id == customerId);
    
    if (selectedCustomer && selectedCustomer.address_id) {
      this.filteredAddresses = [
        { 
          id: selectedCustomer.address_id, 
          full_address: selectedCustomer.full_address 
        }
      ];
      this.evaluationForm.patchValue({ 
        address_id: selectedCustomer.address_id 
      });
    } else {
      this.filteredAddresses = [];
      this.evaluationForm.patchValue({ address_id: '' });
    }
  }

  closeForm() {
    this.location.back();
  }

  onSearch(event: any) {
    if (this.loadingEvaluation) return;
    this.searchTerm = event.target.value;
    this.showResults = true;
    this.filteredAddresses = [];
    this.evaluationForm.patchValue({ customer_id: '', address_id: '' });

    this.filterCustomerSuggestions();
  }

  customerName(customer: Customer): string {
    return `${customer.first_name} ${customer.last_name || ''}`.trim();
  }

  private filterCustomerSuggestions() {
    const term = this.searchTerm.trim().toLowerCase();
    const unique = new Map<number, Customer>();
    if (term && !this.loadingCustomers && !this.customerLoadError) {
      for (const customer of this.customers) {
        if (customer.id && this.customerName(customer).toLowerCase().includes(term)) {
          unique.set(customer.id, customer);
        }
      }
    }
    this.filteredCustomers = [...unique.values()];
    this.activeCustomerIndex = this.filteredCustomers.length ? 0 : -1;
  }

  private addressesForCustomer(customer: Customer) {
    const addresses = new Map<number, { id: number; full_address?: string }>();
    for (const row of [...this.customers.filter(c => c.id === customer.id), customer]) {
      if (row.address_id) addresses.set(row.address_id, { id: row.address_id, full_address: row.full_address });
    }
    return [...addresses.values()];
  }

  onCustomerSearchFocus() {
    this.showResults = !this.evaluationForm.get('customer_id')?.value;
  }

  onCustomerSearchFocusOut(event: FocusEvent) {
    const container = event.currentTarget as HTMLElement;
    if (!container.contains(event.relatedTarget as Node | null)) this.showResults = false;
  }

  onCustomerSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.showResults = false;
      this.activeCustomerIndex = -1;
      return;
    }
    if (event.key === 'Enter') event.preventDefault();
    if (this.loadingEvaluation || this.loadingCustomers || this.customerLoadError || !this.searchTerm.trim()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.showResults = true;
      const count = this.filteredCustomers.length;
      if (count) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        this.activeCustomerIndex = this.activeCustomerIndex < 0
          ? (direction > 0 ? 0 : count - 1)
          : (this.activeCustomerIndex + direction + count) % count;
        this.changeDetector.detectChanges();
        document.getElementById(this.activeCustomerOptionId!)?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter' && this.customerSuggestionsOpen) {
      event.preventDefault();
      const customer = this.filteredCustomers[this.activeCustomerIndex];
      if (customer) this.selectCustomer(customer);
      else if (!this.filteredCustomers.length) this.openCustomerModal();
    }
  }

  selectCustomer(customer: Customer) {
    if (this.loadingEvaluation || !customer.id) return;
    this.searchTerm = this.customerName(customer);
    this.evaluationForm.patchValue({ customer_id: customer.id });
    this.showResults = false;
    this.activeCustomerIndex = -1;
    this.filteredAddresses = this.addressesForCustomer(customer);
    this.evaluationForm.patchValue({ address_id: this.filteredAddresses[0]?.id || '' });
  }

  openCustomerModal() {
    if (this.loadingEvaluation || this.customerModalOpen || this.loadingCustomers || this.customerLoadError) return;
    this.showResults = false;
    this.customerModalOpen = true;
    this.changeDetector.detectChanges();
    this.customerDialog.nativeElement.showModal();
    this.customerDialog.nativeElement.querySelector<HTMLInputElement>('input')?.focus();
  }

  closeCustomerModal() {
    if (!this.modalCustomerForm?.submitting) this.customerDialog.nativeElement.close();
  }

  onCustomerDialogCancel(event: Event) {
    // A request already sent cannot be undone by closing the dialog.
    if (this.modalCustomerForm?.submitting) event.preventDefault();
  }

  onCustomerDialogClosed() {
    this.customerModalOpen = false;
    this.customerSearch.nativeElement.focus();
  }

  trapCustomerFocus(event: Event) {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Tab') return;
    const controls = Array.from(this.customerDialog.nativeElement.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'
    )).filter(control => control.getClientRects().length > 0);
    const target = event.shiftKey ? controls[controls.length - 1] : controls[0];
    const boundary = event.shiftKey ? controls[0] : controls[controls.length - 1];
    if (!controls.length || document.activeElement === boundary) {
      event.preventDefault();
      target?.focus();
    }
  }

  onCustomerCreated(customer: Customer) {
    this.customers = [...this.customers.filter(c => c.id !== customer.id), customer];
    this.selectCustomer(customer);
    this.customerDialog.nativeElement.close();
  }
}
