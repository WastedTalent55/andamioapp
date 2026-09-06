import { Component, OnInit, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  LucideAngularModule,  
  LayoutDashboard,
  Kanban,
  Users,
  FileText,
  HardHat,
  Settings,
  ChevronDown,
  LogOut
} from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  LayoutDashboard = LayoutDashboard;
  Kanban = Kanban;
  Users = Users;
  FileText = FileText;
  HardHat = HardHat;
  Settings = Settings;
  ChevronDown = ChevronDown;
  LogOut = LogOut;
  
  tenantName: string = 'Andamio';
  isAccountMenuOpen = false;

  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  ngOnInit() {
      this.tenantService.tenantName$.subscribe(name => {
      this.tenantName = name;
    });
    
    this.loadTenantBrand();
  } 
  

  loadTenantBrand() {
  this.tenantService.getMyTenantConfig().subscribe({
    next: (res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const nameFromDb = res.data[0].company_name; 
        this.tenantService.emitNewName(nameFromDb);
      }
    },
    error: (err) => {
      console.log('Error 404: La ruta /config no responde o el token expiró.');
      this.tenantName = 'Andamio'; 
    }
  });
}

  toggleAccountMenu(event: Event) {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  // Cierra el menú si se hace clic en cualquier lugar fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isAccountMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isAccountMenuOpen = false;
    }
  }

  logout() {
    this.isAccountMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }
}