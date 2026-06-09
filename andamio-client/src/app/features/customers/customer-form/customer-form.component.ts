import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './customer-form.component.html'
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);

  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(10)]],
    phone: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe({
        next: (res) => {
          alert('¡Cliente registrado con éxito!');
          this.customerForm.reset();
        },
        error: (err) => console.error('Error al registrar cliente', err)
      });
    }
  }
}
