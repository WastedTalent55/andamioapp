import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service'; 
import { QuoteService } from '../../../core/services/quote.service'; 
import { Location } from '@angular/common';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './quote-form.component.html',
  styleUrls: ['./quote-form.component.css']
})
export class QuoteFormComponent implements OnInit {
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

  ngOnInit() {
    this.evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    this.initForm();
    this.loadEvaluationData();
    this.loadExistingQuoteData();
    this.quoteForm.valueChanges.subscribe(() => {
      this.updateTotals(); 
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
    this.quoteService.getQuoteByEvaluationId(this.evaluationId).subscribe((res: any) => {
      const quote = res.data ? res.data : res;
    
      if (quote && quote.items) {
        this.laborItems.clear();
        this.materialItems.clear();
        this.isEditMode = true; 
        this.quoteId = quote.id || quote.quote_id;

        quote.items.forEach((item: any) => {
          const group = this.fb.group({
            description: [item.description, Validators.required],
            unit_price: [item.unit_price, Validators.required],
            quantity: [item.quantity, Validators.required],
            unit: [item.unit, Validators.required],
            total_price: [item.total_price]
          });

          if (item.type === 'mano_de_obra') { 
            this.laborItems.push(group);
          } else if (item.type === 'material') {
            this.materialItems.push(group);
          }
        });

        this.quoteForm.patchValue({
          delivery_time: quote.delivery_time || '2 DIAS',
          evaluation_discount: quote.evaluation_discount > 0 ? quote.evaluation_discount : this.evaluation_discount,
          total_amount: quote.total_amount
        });
      } else {
        this.isEditMode = false;
      }
    });
  }

  private loadEvaluationData() {
    this.evalService.getEvaluationById(this.evaluationId).subscribe(data => {
      this.evaluationNotes = data.requirements; 
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
      alert('❌ Por favor, completa todos los campos técnicos antes de finalizar.');
      return;
    }

    const allItems = [
      ...this.quoteForm.value.laborItems.map((i: any) => ({ 
        ...i, 
        type: 'mano_de_obra', 
        total_price: (+i.unit_price * +i.quantity) 
      })),
      ...this.quoteForm.value.materialItems.map((i: any) => ({ 
        ...i, 
        type: 'material',
        total_price: (+i.unit_price * +i.quantity)
      }))
    ];

    const formValues = this.quoteForm.getRawValue();

    const finalData = {
      evaluation_id: this.evaluationId,
      customer_id: this.customerId,
      version_number: this.currentVersion || 1,
      delivery_time: +this.quoteForm.value.delivery_time,
      status: 'borrador' as const,
      evaluation_discount: this.grandTotal - this.finalAmount, 
      total_amount: this.finalAmount,
      items: allItems 
    };

    if (this.isEditMode && this.quoteId) {
      this.quoteService.updateQuote(this.quoteId, finalData).subscribe({
        next: () => alert('✅ CAMBIOS GUARDADOS CORRECTAMENTE'),
        error: () => alert('❌ Error al actualizar en MySQL')
      });
    } else {
      this.quoteService.createQuote(finalData).subscribe({
        next: () => {
          alert('✅ COTIZACIÓN CREADA');
          this.router.navigate(['/board']);
        },
        error: (err) => alert('❌ Error al crear la cotización')
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
  
}