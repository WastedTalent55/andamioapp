import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/ui/sidebar/sidebar.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule,
    RouterOutlet, 
    SidebarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'andamio-client';
  showSidebar = false;
  private router = inject(Router);

  ngOnInit() {
    // 1. CHEQUEO INICIAL: Apenas carga la app, revisamos dónde estamos
    this.checkRoute(this.router.url);

    // 2. ESCUCHA ACTIVA: Cada vez que cambies de página, volvemos a revisar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }

  private checkRoute(url: string) {
    // Si la ruta NO es welcome, login o register, mostramos el menú
    const authRoutes = ['/', '/welcome', '/login', '/register'];
    this.showSidebar = !authRoutes.includes(url);
    
    // Debug para ti: Abre la consola (F12) y mira qué sale aquí
    console.log("¿Mostramos menú?", this.showSidebar, "Ruta actual:", url);
  }
  
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const authRoutes = ['', '/welcome', '/login', '/register'];
      this.showSidebar = !authRoutes.includes(event.urlAfterRedirects);
    });
  }
}
