import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../shared/layout/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/cards/kpi-card/kpi-card.component';
import { NewQuoteModalComponent } from '../quotes/new-quote-modal/new-quote-modal.component';
import { CustomerService } from '../../core/services/customer.service';
import { EvaluationService } from '../../core/services/evaluation.service';
import { QuoteService } from '../../core/services/quote.service';
import { ProjectService } from '../../core/services/project.service';
import { ActivityService, ActivityItem } from '../../core/services/activity.service';
import { TenantService } from '../../core/services/tenant.service';
import { Router } from '@angular/router';
import {
  Users,
  ClipboardCheck,
  FileText,
  HardHat,
  Calendar,
  Zap,
  LucideAngularModule
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent,
    KpiCardComponent,
    LucideAngularModule,
    NewQuoteModalComponent
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
  private evaluationService = inject(EvaluationService);
  private quoteService = inject(QuoteService);
  private projectService = inject(ProjectService);
  private activityService = inject(ActivityService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  
  userName: string = '';
  isMenuOpen = false;

  totalClientes = 0;
  clientesNuevos: number = 0;

  totalEvaluaciones: number = 0;
  evaluacionesPendientes: number = 0;

  totalCotizaciones = 0;
  cotizacionesEnviadas = 0;

  totalProyectos = 0;
  proyectosActivos = 0;

  recentActivity: ActivityItem[] = [];
  loadingActivity = true;

  ngOnInit() {
  // 1. Nombre del admin — arranca con lo que ya había, y se actualiza en vivo
  // si se edita en Configuración (sin necesidad de recargar la página)
  this.tenantService.userName$.subscribe(name => {
    this.userName = name;
  });

  // 2. Carga única de Clientes (Total + Nuevos)
  this.customerService.getCustomerCount().subscribe({
    next: (res) => {
      if (!res.data) return;
      this.totalClientes = res.data.total;
      this.clientesNuevos = res.data.newThisMonth;
    },
    error: (err) => console.error("Error en Clientes:", err)
  });

  // 3. Carga única de Evaluaciones (Total + Pendientes)
  this.evaluationService.getEvaluationCount().subscribe({
    next: (res) => {
      if (!res.data) return;
      this.totalEvaluaciones = res.data.total;
      this.evaluacionesPendientes = res.data.pendiente;
    },
    error: (err) => console.error("Error en Evaluaciones:", err)
  });

  // 4. Carga única de Cotizaciones (Total + Enviadas)
  this.quoteService.getQuoteStats().subscribe({
    next: (res) => {
      if (!res.data) return;
      this.totalCotizaciones = res.data.total;
      this.cotizacionesEnviadas = res.data.enviada;
    },
    error: (err) => console.error("Error en Cotizaciones:", err)
  });

  // 5. Carga única de Proyectos (Total + Activos)
  this.projectService.getProjectStats().subscribe({
    next: (res) => {
      if (!res.data) return;
      this.totalProyectos = res.data.total;
      this.proyectosActivos = res.data.activo;
    },
    error: (err) => console.error("Error en Proyectos:", err)
  });

  // 6. Actividad reciente (mezcla evaluaciones + cotizaciones + proyectos)
  this.activityService.getRecent(6).subscribe({
    next: (res) => {
      this.recentActivity = res.data || [];
      this.loadingActivity = false;
    },
    error: (err) => {
      console.error("Error en Actividad reciente:", err);
      this.loadingActivity = false;
    }
  });
}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  createCustomer() {
    this.router.navigate(['/customer/new']);
  }

  createEvaluation() {
    this.router.navigate(['/evaluations/new']);
  }

  showNewQuoteModal = false;

  createQuote() {
    this.showNewQuoteModal = true;
  }

  goToBoard() {
    this.router.navigate(['/board']);
  }
}