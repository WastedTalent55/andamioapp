import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customer-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.css'
})
export class CustomerCardComponent {
  @Input() customer!: Customer;

  // 🆕 Cuando pickMode es true, la tarjeta deja de navegar al perfil del cliente
  // y en su lugar emite la selección, para que el componente padre decida qué hacer
  @Input() pickMode: boolean = false;
  @Output() picked = new EventEmitter<Customer>();

  // 🆕 Avisa al padre (customer-list) que este cliente ya se borró, para que
  // lo quite del arreglo — la tarjeta no es dueña de la lista completa.
  @Output() deleted = new EventEmitter<number>();

  private router = inject(Router);
  private customerService = inject(CustomerService);

  deleting = false;

  openCustomer(){
    if (this.pickMode) {
      this.picked.emit(this.customer);
      return;
    }
    this.router.navigate(['/customer/new', this.customer.id]);
  }

  editCustomer(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/customer/new', this.customer.id]);
  }

  deleteCustomer(event: Event) {
    event.stopPropagation();

    if (!this.customer.id || this.deleting) return;

    const confirmDelete = confirm(
      `¿Eliminar a ${this.customer.first_name} ${this.customer.last_name}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    this.deleting = true;

    this.customerService.deleteCustomer(this.customer.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleted.emit(this.customer.id);
      },
      error: (err) => {
        this.deleting = false;

        if (err.status === 409) {
          alert(`⚠️ ${err.error?.message || 'Este cliente tiene registros asociados y no se puede eliminar.'}`);
          return;
        }

        console.error('Error eliminando cliente:', err);
        alert('❌ No se pudo eliminar el cliente.');
      }
    });
  }
}