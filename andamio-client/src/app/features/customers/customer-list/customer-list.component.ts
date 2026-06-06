import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService} from '../../../core/services/customer.service'; 
import { Customer } from '../../../core/models/customer.model'; 

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrls: []
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  customers: Customer[] = [];

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        // Asumiendo que tu API devuelve { success: true, data: [...] }
        this.customers = response.data;
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }
}
