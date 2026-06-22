import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent {
  constructor(private router: Router ) {}

  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);

  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(10)]],
    phone: ['', [Validators.required]]
  });

  closeForm() {
    this.router.navigate(['/dashboard']);
  }

  onSubmit() {
  if (this.customerForm.valid) {
    // 1. Llamada al servicio para persistir en MySQL
    this.customerService.createCustomer(this.customerForm.value).subscribe({
      next: (response) => {
        // 2. Invitación estratégica (Tecnología Honesta)
        const confirmEval = confirm("✅ Cliente guardado con éxito.\n\n¿Deseas agendar la cita de evaluación ahora mismo?");

        if (confirmEval) {
          // Navegamos al siguiente paso del flujo operativo [1]
          // Pasamos el ID del cliente para que el siguiente form ya sepa de quién se trata
          this.router.navigate(['/evaluations/new'], { 
            queryParams: { clientId: response.id } 
          });
        } else {
          // Si no, regresamos al Centro de Mando (Dashboard)
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error("Error en la infraestructura de datos:", err);
        alert("Hubo un error al guardar. Revisa la consola.");
      }
    });
  }
}

}
