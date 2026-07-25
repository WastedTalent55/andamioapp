import { Component, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { QuoteService } from '../../../core/services/quote.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Location } from '@angular/common';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './quote-preview.component.html',
  styleUrls: ['./quote-preview.component.css']
})

export class QuotePreviewComponent implements OnInit {
  quoteId: string | null = null;
  selectedColor: string = '#FFB800'; 
  tenantConfig: any = null;
  quoteData: any = null;
  
  // 🛠️ 1. NUEVAS VARIABLES DE CÁLCULO (OBLIGATORIAS PARA EL HTML)
  laborItems: any[] = [];
  materialItems: any[] = [];
  laborSubtotal: number = 0;
  materialsSubtotal: number = 0;
  evaluationDiscount: number = 300; // Valor del ejemplo de Charly [2]
  netTotal: number = 0;
  downPayment: number = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private quoteService: QuoteService
  ) {}
  
    private location = inject(Location);
  

  ngOnInit() {
    this.quoteId = this.route.snapshot.paramMap.get('id');
    this.loadInitialData();
  }

  loadInitialData() {
    // CARGAR INFO DEL TENANT
    this.tenantService.getMyTenantConfig().subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          this.tenantConfig = res.data[0]; 
          this.selectedColor = this.tenantConfig.brand_color || '#FFB800';
        }
      }
    });

    // CARGAR INFO DE LA COTIZACIÓN
    if (this.quoteId) {
      this.quoteService.getQuoteById(Number(this.quoteId)).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.quoteData = Array.isArray(res.data) ? res.data[0] : res.data;

            if (this.quoteData.items) {
              // 🛠️ 2. SEPARACIÓN Y CÁLCULO POR LÍNEA (Igual al PDF de Charly) [1, 3]
              this.laborItems = this.quoteData.items.filter((i: any) => i.type === 'mano_de_obra');
              this.materialItems = this.quoteData.items.filter((i: any) => i.type === 'material');

              // 🛠️ 3. CÁLCULO DE SUBTOTALES (Trazabilidad Financiera) [7]
              this.laborSubtotal = this.laborItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);
              this.materialsSubtotal = this.materialItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);
              
              // 🛠️ 4. LÓGICA DE CIERRE (Total Neto y Anticipo 50%) [2, 7]
              const rawTotal = this.laborSubtotal + this.materialsSubtotal;
              this.evaluationDiscount = Number(this.quoteData.evaluation_discount) || 0;
              this.netTotal = Number(this.quoteData.total_amount) - this.evaluationDiscount;
              this.downPayment = this.netTotal / 2;
            }
          }
        }
      });
    }
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  closePreview() {
    this.location.back();
  }

  downloadPDF() {
    window.print(); 
  }

  saveColorDefault() {
    // Lógica para persistir el color en el perfil del Tenant [6]
  };
}