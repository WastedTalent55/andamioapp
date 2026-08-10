import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.css'
})
export class CustomerCardComponent {
  @Input() customer: any;
  
  private router = inject(Router);

  openCustomer(){
    this.router.navigate(['/customer/new', this.customer.id]);
  }
}
