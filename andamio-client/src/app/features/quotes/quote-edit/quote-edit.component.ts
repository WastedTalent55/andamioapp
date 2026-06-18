import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service'; 
import { QuoteService } from '../../../core/services/quote.service'; 

@Component({
  selector: 'app-quote-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
    // 1. Usamos 'evaluationId' que es como definimos la ruta técnica
    this.evaluationId = Number(this.route.snapshot.paramMap.get('evaluationId'));
    this.initForm();
    this.loadEvaluationData();
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

  // --- GETTERS PARA LAS LISTAS ---
  get laborItems() { return this.quoteForm.get('laborItems') as FormArray; }
  get materialItems() { return this.quoteForm.get('materialItems') as FormArray; }

  // --- GESTIÓN DE FILAS DINÁMICAS ---
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

  // --- CARGA DE DATOS (TRAZABILIDAD) ---
  private loadEvaluationData() {
    this.evalService.getEvaluationById(this.evaluationId).subscribe(data => {
      // Recordamos el ajuste que hicimos: 'data' ya es el objeto directo
      this.evaluationNotes = data.requirements; 
      this.discountValue = Number(data.evaluation_cost); 
      this.customerId = data.customer_id;
    });
  }

  // --- CÁLCULO DINÁMICO DE TOTALES [6] ---
  calculateRowTotal(type: 'labor' | 'material', index: number): number {
    const group = type === 'labor' ? this.laborItems.at(index) : this.materialItems.at(index);
    return (group.value.price || 0) * (group.value.quantity || 0);
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

  onSubmit() {
    if (this.quoteForm.invalid) return;

    const finalData = {
      evaluation_id: this.evaluationId,
      customer_id: this.customerId,
      ...this.quoteForm.value,
      total_amount: this.finalAmount,
      anticipo: this.finalAmount / 2 // Estándar del 50% según ejemplo de Charly Pulenta [7]
    };

    console.log('🚀 Enviando Cotización Formal:', finalData);
    this.quoteService.createQuote(finalData).subscribe(() => {
      alert('¡Cotización creada y lista para el cliente!');
      this.router.navigate(['/board']); // Volvemos al tablero para ver el flujo real [3]
    });
  }

  saveAsDraft() {

  }
}