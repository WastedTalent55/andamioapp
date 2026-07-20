import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // 💡 IMPORTANTE: Aquí metemos el Sidebar y el RouterOutlet
  imports: [CommonModule, RouterOutlet, SidebarComponent], 
  template: `
    <div class="main-layout">
      <app-sidebar></app-sidebar> 
      <main class="content-container">
        <router-outlet></router-outlet> 
      </main>
    </div>
  `,
  styleUrls: ['./main-layout.component.css'] // O usa los estilos que ya tienes en global.css [1, 2]
})

export class MainLayoutComponent {}
