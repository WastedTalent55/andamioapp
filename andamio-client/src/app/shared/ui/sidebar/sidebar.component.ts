import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private tenantService = inject(TenantService);
  
  // Iniciamos con "Andamio" como valor por defecto (Fallback)
  tenantName: string = 'Andamio';

  ngOnInit() {
    this.tenantService.tenantName$.subscribe(name => {
      this.tenantName = name;
    });
    this.loadTenantBrand();
  }

  loadTenantBrand() {
    this.tenantService.getTenantData(1).subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          const tenant = res.data[0]
          const nameFromDb = res.data[0].company_name;
          this.tenantService.emitNewName(nameFromDb);
        }
      },
      error: (err) => console.log('Usando marca por defecto en sidebar.')
    });
  }
}