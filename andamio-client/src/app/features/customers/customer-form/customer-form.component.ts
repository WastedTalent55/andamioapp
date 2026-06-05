import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Importante para que funcione el formulario
  templateUrl: './customer-form.component.html'
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);

  // Definimos la estructura del cliente según nuestro modelo de datos [4]
  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe({
        next: (res) => {
          alert('¡Cliente registrado con éxito!');
          this.customerForm.reset();
          // Aquí podríamos recargar la lista de clientes después
        },
        error: (err) => console.error('Error al registrar cliente', err)
      });
    }
  }
}
