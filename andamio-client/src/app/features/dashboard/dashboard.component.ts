import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CustomerService } from '../../core/services/customer.service';
import {
  Users,
  ClipboardCheck,
  FileText,
  HardHat,
  Calendar,
  Zap,
  LucideAngularModule,
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent,
    KpiCardComponent,
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  Users = Users;
  ClipboardCheck = ClipboardCheck;
  FileText = FileText;
  HardHat = HardHat;
  Calendar = Calendar;
  Zap = Zap;
  
  private customerService = inject(CustomerService);
  
  userName: string = '';
  isMenuOpen = false;
  totalClientes = 0;

  ngOnInit() {
    this.userName = localStorage.getItem('andamio_user_name') || '';
    this.loadCustomerCount();
  }

  loadCustomerCount() {
    this.customerService.getCustomerCount().subscribe({
      next: (response) => {
        // Asignamos el valor 'total' que viene de tu API
        this.totalClientes = response.total;
      },
      error: (err) => {
        console.error('Error al obtener el conteo de clientes:', err);
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
