import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service'; 
import { QuoteService } from '../../../core/services/quote.service'; 

@Component({
  selector: 'app-quote-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,  
    RouterModule
  ],
  templateUrl: './quote-edit.component.html',
  styleUrls: ['./quote-edit.component.css']
})
export class QuoteEditComponent implements OnInit {
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
    this.evaluationId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadEvaluationData();
  }

  private initForm() {
    this.quoteForm = this.fb.group({
      description: ['', Validators.required],
      labor_price: [0, [Validators.required, Validators.min(0)]],
      delivery_time: ['2 DIAS'],
      items: this.fb.array([])
    });
  }

  private loadEvaluationData() {
    this.evalService.getEvaluationById(this.evaluationId).subscribe(res => {
      this.evaluationNotes = res.data.requirements; 
      this.discountValue = res.data.evaluation_cost; 
      this.customerId = res.data.customer_id;
    });
  }

  get items() { return this.quoteForm.get('items') as FormArray; }

  addItem() {
    this.items.push(this.fb.group({
      description: ['', Validators.required],
      price: [0, Validators.required],
      quantity: [1, Validators.required],
      unit: ['LT']
    }));
  }

  removeItem(index: number) { this.items.removeAt(index); }

  get totals() {
    const labor = this.quoteForm.value.labor_price || 0;
    const materials = this.items.controls.reduce((acc, ctrl) => 
      acc + (ctrl.value.price * ctrl.value.quantity), 0);
    
    const sumaTotal = labor + materials;
    const finalTotal = Math.max(0, sumaTotal - this.discountValue);
    
    return {
      sumaTotal,
      finalTotal,
      anticipo: finalTotal / 2 
    };
  }

  onSubmit() {
    if (this.quoteForm.invalid) return;

    const finalData = {
      evaluation_id: this.evaluationId,
      customer_id: this.customerId,
      ...this.quoteForm.value,
      total_amount: this.totals.finalTotal
    };

    this.quoteService.createQuote(finalData).subscribe(() => {
      alert('Cotización creada con éxito.');
      this.router.navigate(['/quotes']);
    });
  }
}