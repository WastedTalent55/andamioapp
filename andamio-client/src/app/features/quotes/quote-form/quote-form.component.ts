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
  discountValue: number = 0;
  evaluationId!: number;
  customerId!: number;

  ngOnInit() {
    this.evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    this.initForm();
    this.loadEvaluationData();
    this.loadExistingQuoteData();
  }

  private initForm() {
    this.quoteForm = this.fb.group({
      // Ahora tenemos dos listas dinámicas para cumplir con la flexibilidad del sistema [4, 5]
      laborItems: this.fb.array([]),
      materialItems: this.fb.array([]),
      delivery_time: ['2 DIAS', Validators.required]
    });

    // Agregamos un renglón inicial de cada uno por defecto
    this.addRow('labor');
    this.addRow('material');
  }

  get laborItems() { return this.quoteForm.get('laborItems') as FormArray; }
  get materialItems() { return this.quoteForm.get('materialItems') as FormArray; }

  addRow(type: 'labor' | 'material') {
    const group = this.fb.group({
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
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

      quote.items.forEach((item: any) => {
        const group = this.fb.group({
          description: [item.description, Validators.required],
          price: [item.unit_price, Validators.required],
          quantity: [item.quantity, Validators.required],
          unit: [item.unit, Validators.required]
        });

        if (item.type === 'labor') {
          this.laborItems.push(group);
        } else if (item.type === 'material') {
          this.materialItems.push(group);
        }
      });

      this.quoteForm.patchValue({
        delivery_time: quote.delivery_time || '2 DIAS'
      });
    }
  });
}


  private loadEvaluationData() {
    this.evalService.getEvaluationById(this.evaluationId).subscribe(data => {
      // Recordamos el ajuste que hicimos: 'data' ya es el objeto directo
      this.evaluationNotes = data.requirements; 
      this.discountValue = Number(data.evaluation_cost); 
      this.customerId = data.customer_id;
    });
  }

  calculateRowTotal(type: 'labor' | 'material', index: number): number {
    const group = type === 'labor' ? this.laborItems.at(index) : this.materialItems.at(index);
    return (group.value.unit_price || 0) * (group.value.quantity || 0);
  }

  get laborTotal(): number {
    return this.laborItems.controls.reduce((acc, _, i) => acc + this.calculateRowTotal('labor', i), 0);
  }

  get materialTotal(): number {
    return this.materialItems.controls.reduce((acc, _, i) => acc + this.calculateRowTotal('material', i), 0);
  }

  get grandTotal(): number {
    return this.laborTotal + this.materialTotal;
  }

  get finalAmount(): number {
    return Math.max(0, this.grandTotal - this.discountValue);
  }

  closeForm() {
    this.location.back();
  }
  
  onSubmit() {
    if (this.quoteForm.invalid) return;

    const finalData = {
      evaluation_id: this.evaluationId,
      customer_id: this.customerId,
      ...this.quoteForm.value,
      total_amount: this.finalAmount,
      anticipo: this.finalAmount / 2 
    };

    console.log('🚀 Enviando Cotización Formal:', finalData);
    this.quoteService.createQuote(finalData).subscribe(() => {
      alert('¡Cotización creada y lista para el cliente!');
      this.router.navigate(['/board']);
    });
  }

  saveAsDraft() {

  }
  
}