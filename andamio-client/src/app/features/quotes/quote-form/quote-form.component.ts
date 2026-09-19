import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service'; 
import { QuoteService } from '../../../core/services/quote.service'; 
import { Location } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteItem } from '../../../core/models/quote.model';
import { LucideAngularModule, X, ClipboardList } from 'lucide-angular';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './quote-form.component.html',
  styleUrls: ['./quote-form.component.css']
})
export class QuoteFormComponent implements OnInit {
  X = X;
  ClipboardList = ClipboardList;

  private location = inject(Location)
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private evalService = inject(EvaluationService);
  private quoteService = inject(QuoteService);
  private router = inject(Router);

  quoteForm!: FormGroup;
  evaluationNotes: string = '';
  evaluation_discount: number = 0;
  evaluationId!: number;
  customerId!: number;
  laborTotal = 0;
  materialTotal = 0;
  grandTotal = 0;
  finalAmount = 0;
  currentVersion: number = 1;
  isEditMode: boolean = false;
  quoteId?: number;
  // 🆕 true cuando la cotización se crea/edita sin pasar por una evaluación
  directMode: boolean = false;

  ngOnInit() {
    this.initForm();

    const evaluationIdParam = this.route.snapshot.paramMap.get('evaluationId');
    const customerIdParam = this.route.snapshot.paramMap.get('customerId');
    const directQuoteIdParam = this.route.snapshot.paramMap.get('id');

    if (evaluationIdParam) {
      // Modo estándar: cotización ligada a una evaluación
      this.evaluationId = Number(evaluationIdParam);
      this.loadEvaluationData();
      this.loadExistingQuoteData();

    } else if (customerIdParam) {
      // 🆕 Modo directo: cotización nueva a partir de un cliente, sin evaluación
      this.directMode = true;
      this.customerId = Number(customerIdParam);
      this.isEditMode = false;

    } else if (directQuoteIdParam) {
      // 🆕 Modo directo: editando una cotización que ya se creó sin evaluación
      this.directMode = true;
      this.loadDirectQuoteData(Number(directQuoteIdParam));
    }

    this.quoteForm.valueChanges.subscribe(() => {
      this.updateTotals(); 
    }); 
  }

  // 🆕 Convierte los items que regresa el backend en filas del FormArray correspondiente
  // (mano_de_obra / material). Compartido por los dos flujos de carga (directo y por evaluación),
  // que antes duplicaban este mismo bloque casi línea por línea.
  private loadItemsIntoForm(items: QuoteItem[] | undefined): void {
    this.laborItems.clear();
    this.materialItems.clear();

    if (!items || !Array.isArray(items)) {
      return;
    }

    items.forEach((item) => {
      const group = this.fb.group({
        description: [item.description, Validators.required],
        unit_price: [item.unit_price, Validators.required],
        quantity: [item.quantity, Validators.required],
        unit: [item.unit, Validators.required],
        total_price: [Number(item.unit_price) * Number(item.quantity)]
      });

      if (item.type === 'mano_de_obra') {
        this.laborItems.push(group);
      } else if (item.type === 'material') {
        this.materialItems.push(group);
      }
    });
  }

  // 🆕 Carga una cotización directa existente (sin evaluación) para editarla
  private loadDirectQuoteData(id: number) {
    this.quoteService.getQuoteById(id).subscribe({
      next: (res) => {
        const quote = res.data;
        if (!quote) return;

        this.isEditMode = true;
        this.quoteId = quote.quote_id;
        this.customerId = quote.customer_id;
        this.currentVersion = quote.version_number || 1;

        this.loadItemsIntoForm(quote.items);

        this.quoteForm.patchValue({
          delivery_time: parseInt(String(quote.delivery_time)),
          evaluation_discount: Number(quote.evaluation_discount) || 0,
        });

        this.updateTotals();
      }
    });
  }

  private initForm() {
    this.quoteForm = this.fb.group({
      laborItems: this.fb.array([]),
      materialItems: this.fb.array([]),
      delivery_time: [null, [Validators.required, Validators.min(1)]],
      evaluation_discount: 0,
      grandTotal: 0,
      finalAmount: 0 
    });

    this.updateTotals();
  }

  get laborItems() { return this.quoteForm.get('laborItems') as FormArray; }
  get materialItems() { return this.quoteForm.get('materialItems') as FormArray; }

  addRow(type: 'labor' | 'material') {
    const group = this.fb.group({
      description: ['', Validators.required],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [type === 'labor' ? 'SERVICIO' : 'LT', Validators.required]
    });

    if (type === 'labor') this.laborItems.push(group);
    else this.materialItems.push(group);
  }

  removeRow(type: 'labor' | 'material', index: number) {
    if (type === 'labor') this.laborItems.removeAt(index);
    else this.materialItems.removeAt(index);
  }

  private loadExistingQuoteData() {
    this.quoteService.getQuoteByEvaluationId(this.evaluationId).subscribe((res) => {
      const quote = res.data;

      if (quote && (quote.quote_id || quote.id)) {
        console.log("Cotización encontrada, entrando en modo edición:", quote);

        this.isEditMode = true;
        this.quoteId = quote.quote_id || quote.id;
        this.currentVersion = quote.version_number || 1;

        this.loadItemsIntoForm(quote.items);

        this.quoteForm.patchValue({
          delivery_time: parseInt(String(quote.delivery_time)),
          evaluation_discount: quote.evaluation_discount > 0
            ? Number(quote.evaluation_discount)
            : this.evaluation_discount,
        });

        this.updateTotals();

      } else {
        console.log("Modo creación: No se encontró cotización previa.");
        this.isEditMode = false;
        this.quoteId = undefined;
        this.updateTotals();
      }
    });
  }

  private loadEvaluationData() {
    this.evalService.getEvaluationById(this.evaluationId).subscribe((res) => {
      const data = res.data;
      if (!data) return;

      this.evaluationNotes = data.requirements ?? '';
      this.customerId = data.customer_id;
      this.evaluation_discount = Number(data.evaluation_cost) || 0; 

      this.quoteForm.patchValue({
      evaluation_discount: this.evaluation_discount
    });
    });
  }

  calculateRowTotal(type: 'labor' | 'material', index: number): number {
    const items = type === 'labor' ? this.laborItems : this.materialItems;
  const group = items.at(index);
  
  const price = +(group.get('unit_price')?.value || 0);
  const qty = +(group.get('quantity')?.value || 0);
  
  return price * qty;
    
  }

  closeForm() {
    this.location.back();
  }

  onSubmit() {
    if (this.quoteForm.invalid) {
      alert('❌ Por favor, completa todos los campos antes de finalizar.');
      return;
    }

    if (!this.customerId) {
      alert('❌ No hay un cliente asignado a esta cotización. Regresa e inicia el flujo desde "Nueva Cotización" en Cotizaciones.');
      return;
    }

    const allItems = [
      ...this.quoteForm.value.laborItems.map((i: { description: string; unit_price: number; quantity: number; unit: string }) => ({ 
        ...i, 
        type: 'mano_de_obra', 
        total_price: (+i.unit_price * +i.quantity) 
      })),
      ...this.quoteForm.value.materialItems.map((i: { description: string; unit_price: number; quantity: number; unit: string }) => ({ 
        ...i, 
        type: 'material',
        total_price: (+i.unit_price * +i.quantity)
      }))
    ];

    const finalData: Partial<Quote> & { items: unknown[] } = {
      evaluation_id: this.directMode ? null : this.evaluationId,
      customer_id: this.customerId,
      version_number: this.currentVersion || 1,
      delivery_time: +this.quoteForm.value.delivery_time,
      status: 'borrador',
      evaluation_discount: this.grandTotal - this.finalAmount, 
      total_amount: this.finalAmount,
      items: allItems 
    };

    if (this.isEditMode && this.quoteId) {
      this.quoteService.updateQuote(this.quoteId, finalData).subscribe({
        next: (res) => {
          if (res.data?.versioned) {
            alert(`✅ El cliente ya había recibido esta cotización, así que se creó la versión ${this.currentVersion + 1} sin perder el historial.`);
          } else {
            alert('✅ CAMBIOS GUARDADOS CORRECTAMENTE');
          }
          this.location.back();
        },
        error: (err) => {
          console.error('Error al actualizar cotización:', err);
          alert('❌ Error al actualizar en MySQL');
        }
      });
    } else {
        this.quoteService.createQuote(finalData).subscribe({
        next: (res) => {
          alert('✅ ¡COTIZACIÓN FINALIZADA Y GUARDADA!');
          if (this.directMode && res.data?.quoteId) {
            // Sin evaluación no hay tarjeta en el board todavía: el destino natural es su propio preview
            this.router.navigate(['/quotes/preview', res.data.quoteId]);
          } else {
            this.router.navigate(['/board']);
          }
        },
        error: (err) => {
          console.error('Error al crear cotización:', err);
          alert('❌ Error al crear la cotización');
        }
      });
    }              
  }

  updateTotals(): void {
  this.laborTotal = this.laborItems.controls.reduce((acc, _, i) => 
    acc + this.calculateRowTotal('labor', i), 0);

  this.materialTotal = this.materialItems.controls.reduce((acc, _, i) => 
    acc + this.calculateRowTotal('material', i), 0);

  this.grandTotal = this.laborTotal + this.materialTotal;

  this.finalAmount = this.grandTotal - this.evaluation_discount;

  this.quoteForm.patchValue({
    grandTotal: this.grandTotal,
    finalAmount: this.finalAmount
  }, { emitEvent: false }); 
  }
  
  generatePDF() {
    const doc = new jsPDF();
    const formValues = this.quoteForm.getRawValue();
  
    // 1. COLORES Y ESTILO
    const cianAndamio: [number, number, number] = [34, 211, 238]; // --andamio-cian
    const obsidiana: [number, number, number] = [15, 23,42];     // --andamio-obsidiana

    // 2. ENCABEZADO
    doc.setFontSize(22);
    doc.setTextColor(...obsidiana);
    doc.text('HANDY QUEER', 14, 20); // Aquí irá tu logo después
  
    doc.setFontSize(10);
    doc.text(`CLIENTX: ${this.evaluationNotes}`, 14, 30); // Usamos las notas o nombre del cliente
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 160, 30);

    // 3. TABLAS DE ÍTEMS (Mano de Obra y Materiales)
    const laborRows = this.laborItems.value.map((item: any) => [
      item.description, 
      `$${(+item.unit_price).toFixed(2)}`, 
      item.quantity, 
      item.unit, 
      `$${(+item.unit_price * +item.quantity).toFixed(2)}`
    ]);

    const materialRows = this.materialItems.value.map((item: any) => [
      item.description, 
      `$${(+item.unit_price).toFixed(2)}`, 
      item.quantity, 
      item.unit, 
      `$${(+item.unit_price * +item.quantity).toFixed(2)}`
    ]);

    // Dibujar tabla de Mano de Obra
    autoTable(doc, {
      startY: 40,
      head: [['MANO DE OBRA', 'PRECIO UNITARIO', 'CANTIDAD', 'UNIDAD', 'PRECIO TOTAL']],
      body: laborRows,
      headStyles: { fillColor: cianAndamio }
    });

    // Dibujar tabla de Materiales
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['MATERIALES', 'PRECIO UNITARIO', 'CANTIDAD', 'UNIDAD', 'PRECIO TOTAL']],
      body: materialRows,
      headStyles: { fillColor: obsidiana }
    });

    // 4. RESUMEN FINANCIERO
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`SUMA TOTAL: $${this.grandTotal.toFixed(2)}`, 140, finalY);
    doc.text(`- COTIZACIÓN EVALUACIÓN: $${this.evaluation_discount.toFixed(2)}`, 140, finalY + 7);
  
    doc.setFontSize(14);
    doc.setTextColor(...cianAndamio);
    doc.text(`TOTAL FINAL: $${this.finalAmount.toFixed(2)}`, 140, finalY + 15);

    // 5. ANTICIPO Y FINIQUITO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`ANTICIPO (50%): $${(this.finalAmount / 2).toFixed(2)}`, 140, finalY + 25);
    doc.text(`FINIQUITO VS ENTREGA: $${(this.finalAmount / 2).toFixed(2)}`, 140, finalY + 32);

    // Guardar el PDF
    doc.save(`Cotizacion_Andamio_${this.evaluationId}.pdf`);
  }
}