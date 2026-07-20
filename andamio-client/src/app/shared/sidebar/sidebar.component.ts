import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  
  tenantName: string = 'Andamio';

  constructor(
    private tenantService: TenantService
  ){}

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
}