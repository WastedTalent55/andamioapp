import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service'; 
import { Customer } from '../../../core/models/customer.model'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);

  // 1. Mantenemos la "Fuente de Verdad" de la BD
  customers: Customer[] = [];

  // 2. Creamos la "Vista Dinámica" para las tarjetas
  filteredCustomers: Customer[] = [];

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        // Inicializamos ambos arreglos con la data de la infraestructura
        this.customers = response.data;
        this.filteredCustomers = response.data;
      },
      error: (err) => console.error('Error en la red de datos de clientes', err)
    });
  }

  // 3. El Motor de Filtrado (Alta Visibilidad)
  onSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (!filterValue) {
      this.filteredCustomers = this.customers; // Si está vacío, mostramos todo el "chasis"
      return;
    }

    // Filtrado multicanal: busca por nombre, apellido o dirección
    this.filteredCustomers = this.customers.filter(customer => 
      customer.first_name.toLowerCase().includes(filterValue) ||
      customer.last_name.toLowerCase().includes(filterValue) ||
      (customer.address && customer.address.toLowerCase().includes(filterValue))
    );
  }
}