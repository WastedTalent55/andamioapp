import { Component, OnInit, inject, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AddressAutocompleteComponent } from '../../../shared/components/address-autocomplete/address-autocomplete.component';
import { AddressData } from '../../../core/models/address.model';
import { LucideAngularModule, User, X, MapPin, Pencil } from 'lucide-angular';

declare var google: any;

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    AddressAutocompleteComponent,
    LucideAngularModule
  ], 
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent implements OnInit {
  private ngZone = inject(NgZone);
 
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);

  User = User;
  X = X;
  MapPin = MapPin;
  Pencil = Pencil;
  
  constructor(private router: Router ) {}

  isEditMode = false;
  customerId?: number;
  submitting = false;

  customerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: [''],
    phone: [''],
    address: ['', [Validators.required]],
    place_id: [''],
    latitude: [null],
    longitude: [null],
    city: [''],
    state: [''],
    postal_code: [''],
    country: ['México']
  });

  // 🆕 Fallback mientras Google Places (facturación) no está activo:
  // permite capturar la dirección a mano sin bloquear el alta de clientes.
  // En modo edición arrancamos aquí directo: no hay forma de "re-seleccionar"
  // un pin ya guardado en el Autocomplete, así que mostramos los campos ya
  // llenos y el usuario decide si quiere buscar una dirección nueva.
  manualAddressMode = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.customerId = Number(idParam);
      this.manualAddressMode = true;
      this.loadCustomer(this.customerId);
    }
  }

  private loadCustomer(id: number) {
    this.customerService.getCustomerById(id).subscribe({
      next: (res) => {
        const customer = res.data;
        if (!customer) return;

        this.customerForm.patchValue({
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          address: customer.full_address || '',
          place_id: customer.place_id || '',
          latitude: customer.latitude ?? null,
          longitude: customer.longitude ?? null,
          city: customer.city || '',
          state: customer.state || '',
          postal_code: customer.postal_code || '',
          country: customer.country || 'México'
        });
      },
      error: (err) => {
        console.error('Error cargando cliente:', err);
        alert('❌ No se pudo cargar el cliente.');
        this.location.back();
      }
    });
  }

  // Función auxiliar para extraer datos específicos de Google
  private extractComponent(components: any[], type: string): string {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : '';
  }


  closeForm() {
    this.location.back();
  }

  onSubmit() {
    if (!this.customerForm.valid || this.submitting) return;

    this.submitting = true;

    if (this.isEditMode && this.customerId) {
      this.customerService.updateCustomer(this.customerId, this.customerForm.value).subscribe({
        next: () => {
          this.submitting = false;
          alert('✅ Cliente actualizado correctamente.');
          this.location.back();
        },
        error: (err) => {
          this.submitting = false;
          console.error('Error actualizando cliente:', err);
          alert('❌ Hubo un error al actualizar. Revisa la consola.');
        }
      });
      return;
    }

    this.customerService.createCustomer(this.customerForm.value).subscribe({
      next: (response) => {
        this.submitting = false;
        const newCustomerId = response.data?.id;

        if (!newCustomerId) {
          // No debería pasar nunca con el backend actual — si aparece, es señal
          // de que el server de Node está corriendo una versión vieja del controller.
          console.error('⚠️ La respuesta no trae data.id — respuesta completa:', response);
          alert('⚠️ El cliente puede haberse guardado, pero la respuesta del servidor no vino completa. Revisa la consola y la lista de clientes antes de reintentar (para no duplicarlo).');
          return;
        }

        // 🆕 Si veníamos del flujo de "cotizar directamente", saltamos la pregunta
        // de la evaluación y vamos derecho al formulario de cotización con este cliente
        const intent = this.route.snapshot.queryParamMap.get('intent');

        if (intent === 'quote') {
          this.router.navigate(['/quotes/new/customer', newCustomerId]);
          return;
        }

        const confirmEval = confirm("✅ Cliente guardado con éxito.\n\n¿Deseas agendar la cita de evaluación ahora mismo?");
      
        if (confirmEval) {
          this.router.navigate(['/evaluations/new'], { 
            queryParams: { clientId: newCustomerId } 
          });
        } else {
          this.location.back();
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error("Error en la infraestructura de datos:", err);
        alert("Hubo un error al guardar. Revisa la consola.");
      }
    });
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

  // 🆕 Alterna entre el buscador de Google Places y la captura manual.
  // Al entrar a modo manual limpiamos place_id/lat/lng: sin Autocomplete no hay
  // geocoding real, y no queremos guardar coordenadas de una búsqueda anterior
  // que ya no corresponden a lo que el usuario está por escribir.
  toggleManualAddress() {
    this.manualAddressMode = !this.manualAddressMode;

    if (this.manualAddressMode) {
      this.customerForm.patchValue({
        place_id: '',
        latitude: null,
        longitude: null
      });
    }
  }

}