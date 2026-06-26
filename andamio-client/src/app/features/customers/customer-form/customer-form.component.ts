import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent {
  constructor(private router: Router ) {}

  private location = inject(Location);
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);

  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(10)]],
    phone: ['', [Validators.required]]
  });

  closeForm() {
    this.location.back();
  }

  onSubmit() {
  if (this.customerForm.valid) {
    this.customerService.createCustomer(this.customerForm.value).subscribe({
      next: (response) => {
        // Invitación estratégica 
        const confirmEval = confirm("✅ Cliente guardado con éxito.\n\n¿Deseas agendar la cita de evaluación ahora mismo?");

        if (confirmEval) {
          this.router.navigate(['/evaluations/new'], { 
            queryParams: { clientId: response.id } 
          });
        } else {
          this.location.back();
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
