import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Customer } from '../../../core/models/customer.model';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, X, ClipboardList, TriangleAlert, Pencil } from 'lucide-angular';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule], 
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

  customers: Customer[] = []; 
  filteredAddresses: any[] = [];
  evaluationForm: FormGroup;

  searchTerm: string = '';
  showResults: boolean = false;
  filteredCustomers: Customer[] = [];

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

    this.customerService.getCustomers().subscribe({
      next: (res) => { 
        this.customers = res.data || [];
        this.filteredCustomers = res.data || [];

        if (idParam) {
          this.isEditMode = true;
          this.evaluationId = Number(idParam);
          this.loadEvaluation(this.evaluationId);
          return;
        }

        this.route.queryParams.subscribe(params => {
          const clientId = params['clientId'];
          if (clientId) {
            const customer = this.customers.find(c => c.id == clientId);
            if (customer) {
              this.selectCustomer(customer);
            }
          }
        });
      },
      error: (err) => console.error('Error cargando infraestructura de clientes', err)
    });
  }

  private loadEvaluation(id: number) {
    this.evaluationService.getEvaluationById(id).subscribe({
      next: (res) => {
        const evaluation: any = res.data;
        if (!evaluation) return;

        const customer = this.customers.find(c => c.id == evaluation.customer_id);
        if (customer) {
          this.searchTerm = `${customer.first_name} ${customer.last_name}`;
        }

        if (evaluation.address_id) {
          this.filteredAddresses = [{ id: evaluation.address_id, full_address: evaluation.address }];
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
    if (!this.evaluationForm.valid) return;

    const payload = this.buildPayload();

    if (this.isEditMode && this.evaluationId) {
      this.evaluationService.updateEvaluationDetails(this.evaluationId, payload).subscribe({
        next: () => {
          alert('✅ Evaluación actualizada con éxito');
          this.router.navigate(['/board']);
        },
        error: (err) => {
          console.error('Error al actualizar la evaluación', err);
          alert('❌ No se pudo actualizar la evaluación.');
        }
      });
      return;
    }

    this.evaluationService.createEvaluation(payload).subscribe({
      next: (res) => {
        alert('✅ Visita técnica agendada con éxito');
        this.router.navigate(['/board']);
      },
      error: (err) => console.error('Error al agendar visita técnica', err)
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
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    this.showResults = true;

    this.filteredCustomers = this.customers.filter(c => 
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(term)
    );
  }

  selectCustomer(customer: Customer) {
    this.searchTerm = `${customer.first_name} ${customer.last_name}`;
    this.evaluationForm.patchValue({ customer_id: customer.id });
    this.showResults = false;

    // Cargamos la dirección automáticamente (reutilizando tu lógica)
    if (customer.address_id) {
      this.filteredAddresses = [{ id: customer.address_id, full_address: customer.full_address }];
      this.evaluationForm.patchValue({ address_id: customer.address_id });
    }
  }
}