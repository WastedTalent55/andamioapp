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
import { LucideAngularModule, Send, CircleCheck, CircleX, Pencil, FileDown, X, MessageCircle } from 'lucide-angular';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  X = X;
  MessageCircle = MessageCircle;
  quoteId: string | null = null;
  selectedColor: string = '#FFB800'; 
  logoShape: 'square' | 'circle' = 'square';
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
          this.logoShape = this.tenantConfig.logo_shape === 'circle' ? 'circle' : 'square';
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
    if (!this.quoteData) return;
    this.generatePDF();
  }

  // Convierte un color hex (#RRGGBB) a [r,g,b], formato que pide jsPDF/autoTable
  private hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  }

  private formatDate(value?: string): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-MX');
  }

  // 🆕 Movido y adaptado desde quote-form.component.ts: ahí no estaba conectado a
  // ningún botón y usaba datos de ejemplo (texto fijo, sin logo/color del tenant).
  // Aquí sí tenemos tenantConfig y los items ya cargados por loadInitialData().
  private generatePDF() {
    if (!this.quoteData) return;

    const doc = new jsPDF();
    const brandColor = this.hexToRgb(this.selectedColor);
    const obsidiana: [number, number, number] = [15, 23, 42];

    const companyName = this.tenantConfig?.company_name || 'Andamio';
    const folio = this.quoteData.quote_folio || this.quoteData.quote_id;

    // ENCABEZADO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...obsidiana);
    doc.text(companyName, 14, 20);

    // Línea de acento con el color de marca, mismo espíritu que el borde superior del preview
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(1.2);
    doc.line(14, 24, 196, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Cotización: ${folio}`, 14, 30);
    doc.text(`Fecha: ${this.formatDate(this.quoteData.created_at)}`, 150, 20);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Cliente: ${this.quoteData.customer_name || ''}`, 14, 41);
    doc.text(`Dirección: ${this.quoteData.full_address || ''}`, 14, 47);
    doc.text(`Teléfono: ${this.quoteData.phone || ''}`, 14, 53);

    // TABLA DE MANO DE OBRA
    const laborRows = this.laborItems.map((item) => [
      item.description,
      this.formatCurrency(item.unit_price),
      String(item.quantity),
      item.unit || 'SERVICIO',
      this.formatCurrency(item.unit_price * item.quantity)
    ]);

    autoTable(doc, {
      startY: 61,
      head: [['MANO DE OBRA', 'PRECIO UNITARIO', 'CANTIDAD', 'UNIDAD', 'PRECIO TOTAL']],
      body: laborRows,
      headStyles: { fillColor: brandColor },
      foot: [[
        { content: 'SUMA TOTAL DE MANO DE OBRA', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: this.formatCurrency(this.laborSubtotal), styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    });

    // TABLA DE MATERIALES
    const materialRows = this.materialItems.map((item) => [
      item.description,
      this.formatCurrency(item.unit_price),
      String(item.quantity),
      item.unit || '',
      this.formatCurrency(item.unit_price * item.quantity)
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['MATERIALES', 'PRECIO UNITARIO', 'CANTIDAD', 'UNIDAD', 'PRECIO TOTAL']],
      body: materialRows,
      headStyles: { fillColor: obsidiana },
      foot: [[
        { content: 'SUMA TOTAL DE MATERIALES', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: this.formatCurrency(this.materialsSubtotal), styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    });

    // RESUMEN FINANCIERO (mismo cálculo que usa el HTML del preview)
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    const subtotal = this.laborSubtotal + this.materialsSubtotal;
    const total = subtotal - this.evaluationDiscount;
    const downPayment = total / 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Subtotal: ${this.formatCurrency(subtotal)}`, 140, finalY);
    doc.text(`Evaluación: -${this.formatCurrency(this.evaluationDiscount)}`, 140, finalY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...brandColor);
    doc.text(`Total: ${this.formatCurrency(total)}`, 140, finalY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Anticipo (50%): ${this.formatCurrency(downPayment)}`, 140, finalY + 23);
    doc.text(`Contra entrega: ${this.formatCurrency(downPayment)}`, 140, finalY + 29);

    // TIEMPO DE ENTREGA
    doc.text(`Tiempo de entrega: ${this.quoteData.delivery_time} días`, 14, finalY);
    finalY += 40;

    // DATOS BANCARIOS
    if (this.tenantConfig?.bank_account) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${this.tenantConfig.bank_name || 'Banco'}`, 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cuenta: ${this.tenantConfig.bank_account}`, 14, finalY + 6);
      if (this.tenantConfig?.bank_clabe) {
        doc.text(`CLABE: ${this.tenantConfig.bank_clabe}`, 14, finalY + 12);
      }
      finalY += 20;
    }

    // TÉRMINOS Y CONDICIONES
    if (this.tenantConfig?.terms_conditions) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      const termsLines = doc.splitTextToSize(this.tenantConfig.terms_conditions, 180);
      doc.text(termsLines, 14, finalY);
      finalY += termsLines.length * 4.5 + 10;
    }

    // 📇 FRANJA DE CONTACTO: solo los datos que el tenant llenó en su configuración
    const contactParts = [
      this.tenantConfig?.phone,
      this.tenantConfig?.email,
      this.tenantConfig?.address,
      this.tenantConfig?.social_media
    ].filter(Boolean);

    if (contactParts.length > 0) {
      doc.setFillColor(...brandColor);
      doc.rect(14, finalY, 182, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      let senderLine = companyName;
      if (this.tenantConfig?.owner_name) senderLine += ` — ${this.tenantConfig.owner_name}`;
      doc.text(senderLine, 18, finalY + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(contactParts.join('   ·   '), 18, finalY + 17);

      finalY += 30;
    }

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('GRACIAS POR LA CONFIANZA', 105, finalY, { align: 'center' });

    doc.save(`Cotizacion_${folio}.pdf`);
  }

  setLogoShape(shape: 'square' | 'circle') {
    this.logoShape = shape;
  }

  // Guarda color de marca y forma del logo en el perfil del Tenant.
  // Importante: Tenant.update() en el backend actualiza TODAS las columnas con lo que
  // reciba en el body, así que mandamos el tenantConfig completo (ya cargado) con solo
  // estos dos campos cambiados — mandar únicamente {brand_color} borraría el resto
  // (nombre, banco, términos, etc.) porque llegarían como undefined.
  saveColorDefault() {
    if (!this.tenantConfig) return;

    const payload = {
      ...this.tenantConfig,
      brand_color: this.selectedColor,
      logo_shape: this.logoShape
    };

    this.tenantService.saveTenantProfile(payload).subscribe({
      next: () => {
        this.tenantConfig = payload;
        alert('✅ Marca guardada como predeterminada.');
      },
      error: () => {
        alert('❌ No se pudo guardar la marca. Intenta de nuevo.');
      }
    });
  }

  // WhatsApp "click-to-chat": abre la conversación con el cliente con un mensaje
  // precargado. No existe forma de adjuntar el PDF automáticamente sin la API de
  // WhatsApp Business (requiere cuenta de Meta Business verificada + servidor propio
  // que hostee el archivo) — eso queda para una fase posterior. Por ahora, descargamos
  // el PDF primero para que solo lo tengan que arrastrar al chat que se abre.
  sendWhatsApp() {
    if (!this.quoteData) return;

    this.generatePDF();

    const folio = this.quoteData.quote_folio || this.quoteData.quote_id;
    const companyName = this.tenantConfig?.company_name || 'Andamio';
    const message =
      `Hola ${this.quoteData.customer_name || ''}, te comparto la cotización ${folio} de ${companyName}. ` +
      `Te adjunto el PDF en este chat.`;

    const phone = this.buildWhatsAppNumber(this.quoteData.phone);
    if (!phone) {
      alert('Esta cotización no tiene un teléfono de cliente registrado.');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // Los teléfonos se guardan a 10 dígitos sin lada país (formato usual en México);
  // wa.me necesita el número completo, así que le anteponemos 52 en ese caso.
  private buildWhatsAppNumber(phone?: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length === 10 ? `52${digits}` : digits;
  }
}