import { Component, inject, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AddressAutocompleteComponent } from '../../../shared/components/address-autocomplete/address-autocomplete.component';
import { AddressData } from '../../../core/models/address.model';

declare var google: any;

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddressAutocompleteComponent], 
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent {
  private ngZone = inject(NgZone);
 
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  
  constructor(private router: Router ) {}
  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    place_id: [''],
    latitude: [null],
    longitude: [null],
    city: [''],
    state: [''],
    postal_code: [''],
    country: ['']
  });

  // Función auxiliar para extraer datos específicos de Google
  private extractComponent(components: any[], type: string): string {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : '';
  }


  closeForm() {
    this.location.back();
  }

  onSubmit() {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe({
        next: (response) => {
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

  onAddressSelected(data: AddressData) {
  // Actualizamos el formulario con la "Estructura Orgánica" de los datos [2]
  this.customerForm.patchValue({
    address: data.full_address,
    place_id: data.place_id,
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    country: data.country
  });
}

}
