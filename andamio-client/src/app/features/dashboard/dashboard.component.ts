import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent,
    KpiCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  isMenuOpen = false;
  totalClientes = 0;

  ngOnInit() {
    this.userName = localStorage.getItem('andamio_user_name') || '';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
