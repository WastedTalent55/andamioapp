import { Component, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { QuoteService } from '../../../core/services/quote.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { Quote, QuoteItem, QuoteVersionHistoryEntry } from '../../../core/models/quote.model';
import { LucideAngularModule, Send, CircleCheck, CircleX, Pencil, FileDown } from 'lucide-angular';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, LucideAngularModule], 
  templateUrl: './quote-preview.component.html',
  styleUrls: ['./quote-preview.component.css']
})

export class QuotePreviewComponent implements OnInit {
  Send = Send;
  CircleCheck = CircleCheck;
  CircleX = CircleX;
  Pencil = Pencil;
  FileDown = FileDown;
  quoteId: string | null = null;
  selectedColor: string = '#FFB800'; 
  tenantConfig: any = null; // sin modelo de Tenant definido aún; fuera del alcance de este refactor
  quoteData: (Quote & { items: QuoteItem[] }) | null = null;
  
  // 🛠️ 1. NUEVAS VARIABLES DE CÁLCULO (OBLIGATORIAS PARA EL HTML)
  laborItems: QuoteItem[] = [];
  materialItems: QuoteItem[] = [];
  laborSubtotal: number = 0;
  materialsSubtotal: number = 0;
  evaluationDiscount: number = 300; // Valor del ejemplo de Charly [2]
  netTotal: number = 0;
  downPayment: number = 0;

  // 🆕 Manejo de status y versionamiento
  versionHistory: QuoteVersionHistoryEntry[] = [];
  updatingStatus: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantService,
    private quoteService: QuoteService
  ) {}
  
    private location = inject(Location);

  // 🆕 Traduce el status a uno de los colores que ya soporta app-status-badge
  statusBadgeColor(status: string): 'blue' | 'green' | 'yellow' | 'gray' | 'red' {
    switch (status) {
      case 'aceptada': return 'green';
      case 'enviada': return 'blue';
      case 'rechazada': return 'red';
      default: return 'yellow'; // borrador
    }
  }

  editQuote() {
    if (!this.quoteData) return;

    if (this.quoteData.evaluation_id) {
      this.router.navigate(['/quotes/edit', this.quoteData.evaluation_id]);
    } else if (this.quoteData.quote_id) {
      // 🆕 Cotización directa (sin evaluación): se edita por su propio id
      this.router.navigate(['/quotes/edit-direct', this.quoteData.quote_id]);
    }
  }
  

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
        next: (res) => {
          if (res.success && res.data) {
            this.quoteData = res.data;

            if (this.quoteData.items) {
              // 🛠️ 2. SEPARACIÓN Y CÁLCULO POR LÍNEA (Igual al PDF de Charly) [1, 3]
              this.laborItems = this.quoteData.items.filter((i) => i.type === 'mano_de_obra');
              this.materialItems = this.quoteData.items.filter((i) => i.type === 'material');

              // 🛠️ 3. CÁLCULO DE SUBTOTALES (Trazabilidad Financiera) [7]
              this.laborSubtotal = this.laborItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);
              this.materialsSubtotal = this.materialItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);
              
              // 🛠️ 4. LÓGICA DE CIERRE (Total Neto y Anticipo 50%) [2, 7]
              const rawTotal = this.laborSubtotal + this.materialsSubtotal;
              this.evaluationDiscount = Number(this.quoteData.evaluation_discount) || 0;
              this.netTotal = Number(this.quoteData.total_amount) - this.evaluationDiscount;
              this.downPayment = this.netTotal / 2;
            }

            this.loadVersionHistory();
          }
        }
      });
    }
  }

  loadVersionHistory() {
    if (!this.quoteId) return;

    this.quoteService.getQuoteHistory(Number(this.quoteId)).subscribe({
      next: (res) => {
        this.versionHistory = res.success && res.data ? res.data : [];
      },
      error: () => {
        this.versionHistory = [];
      }
    });
  }

  // 🆕 Enviar al cliente: borrador -> enviada
  markAsSent() {
    this.changeStatus('enviada', '¿Marcar esta cotización como enviada al cliente?');
  }

  // 🆕 El cliente aceptó: en vez de solo cambiar el status, abrimos el formulario
  // para capturar los datos del proyecto. El status pasa a 'aceptada' recién cuando
  // el proyecto se crea de verdad (ver ProjectService.createProjectFromQuote en backend) —
  // así no queda una cotización "aceptada" sin proyecto si el usuario cierra el formulario.
  markAsAccepted() {
    if (!this.quoteId) return;
    this.router.navigate(['/projects/new', this.quoteId]);
  }

  markAsRejected() {
    this.changeStatus('rechazada', '¿Marcar esta cotización como rechazada?');
  }

  private changeStatus(status: Quote['status'], confirmMessage: string) {
    if (!this.quoteId || !confirm(confirmMessage)) return;

    this.updatingStatus = true;

    this.quoteService.updateQuoteStatus(Number(this.quoteId), status).subscribe({
      next: () => {
        this.updatingStatus = false;
        if (this.quoteData) {
          this.quoteData.status = status;
        }
      },
      error: () => {
        this.updatingStatus = false;
        alert('❌ No se pudo actualizar el estatus de la cotización.');
      }
    });
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