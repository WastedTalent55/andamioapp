import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service'; 
import { Customer } from '../../../core/models/customer.model'; 
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { CustomerCardComponent } from '../../../shared/cards/customer-card/customer-card.component'; 

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CustomerCardComponent
],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  customers: Customer[] = [];

  filteredCustomers: Customer[] = [];

  // 🆕 Modo selección: cuando llegamos aquí desde "Cotizar directamente"
  pickForQuote: boolean = false;

  ngOnInit(): void {
    this.pickForQuote = this.route.snapshot.queryParamMap.get('mode') === 'pick-for-quote';
    this.loadCustomers();
  }

  navegarANuevoCliente() {
    if (this.pickForQuote) {
      this.router.navigate(['/customer/new'], { queryParams: { intent: 'quote' } });
      return;
    }
    this.router.navigate(['/customer/new']);
  }

  // 🆕 Se dispara al elegir un cliente en modo selección
  onCustomerPicked(customer: Customer) {
    this.router.navigate(['/quotes/new/customer', customer.id]);
  }

  // 🆕 Se dispara cuando customer-card ya eliminó el cliente en el backend —
  // aquí solo lo quitamos de la vista, sin volver a pedir toda la lista.
  onCustomerDeleted(customerId: number) {
    this.customers = this.customers.filter(c => c.id !== customerId);
    this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== customerId);
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers = response.data || [];
        this.filteredCustomers = response.data || [];
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