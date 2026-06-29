import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Customer } from '../../../core/models/customer.model';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.css'
})

export class EvaluationFormComponent implements OnInit {
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private router = inject(Router); 
  private customerService = inject(CustomerService);
  private evaluationService = inject(EvaluationService);

  customers: Customer[] = []; 
  filteredAddresses: any[] = [];
  evaluationForm: FormGroup;

  constructor() {
    this.evaluationForm = this.fb.group({
      customer_id: ['', [Validators.required]], 
      address_id: ['', Validators.required],
      scheduled_date: ['', [Validators.required]],
      evaluation_cost: [0, [Validators.min(0)]], 
      requested_work: ['', [Validators.required, Validators.maxLength(255)]],
      requirements: ['']
    });
  }

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe({
      next: (res) => this.customers = res.data,
      error: (err) => console.error('Error cargando infraestructura de clientes', err)
    });
  }

  
  onSubmit(): void {
    if (this.evaluationForm.valid) {
      this.evaluationService.createEvaluation(this.evaluationForm.value).subscribe({
        next: (res) => {
          alert('✅ Visita técnica agendada con éxito');
          this.router.navigate(['/board']);
        },
        error: (err) => console.error('Error al agendar visita técnica', err)
      });
    }
  }

  onCustomerChange(event: any) {
    const customerId = event.target.value;
    const selectedCustomer = this.customers.find(c => c.id == customerId);
    
    if (selectedCustomer && selectedCustomer.address_id) {
      this.filteredAddresses = [
        { id: selectedCustomer.address_id, full_address: selectedCustomer.address }
      ];
      this.evaluationForm.patchValue({ address_id: selectedCustomer.address_id });
    } else {
      this.filteredAddresses = [];
      this.evaluationForm.patchValue({ address_id: '' });
    }
  }

  closeForm() {
    this.location.back();
  }

}