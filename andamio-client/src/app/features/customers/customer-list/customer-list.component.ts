import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service'; 
import { Customer } from '../../../core/models/customer.model'; 
import { RouterLink, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);

  customers: Customer[] = [];

  filteredCustomers: Customer[] = [];

  ngOnInit(): void {
    this.loadCustomers();
  }

  navegarANuevoCliente() {
    this.router.navigate(['/customer/new']);
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers = response.data;
        this.filteredCustomers = response.data;
      },
      error: (err) => console.error('Error en la red de datos de clientes', err)
    });
  }

  onSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (!filterValue) {
      this.filteredCustomers = this.customers; 
      return;
    }

    this.filteredCustomers = this.customers.filter(customer => 
      customer.first_name.toLowerCase().includes(filterValue) ||
      customer.last_name.toLowerCase().includes(filterValue) ||
      (customer.full_address && customer.full_address.toLowerCase().includes(filterValue))
    );
  }
}