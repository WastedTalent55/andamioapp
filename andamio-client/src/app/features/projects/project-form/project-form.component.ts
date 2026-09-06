import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { QuoteService } from '../../../core/services/quote.service';
import { Quote, QuoteItem } from '../../../core/models/quote.model';
import { LucideAngularModule, X, HardHat } from 'lucide-angular';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css'
})
export class ProjectFormComponent implements OnInit {
  X = X;
  HardHat = HardHat;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private projectService = inject(ProjectService);
  private quoteService = inject(QuoteService);

  quoteId!: number;
  quoteData: (Quote & { items: QuoteItem[] }) | null = null;
  submitting = false;

  projectForm: FormGroup = this.fb.group({
    project_name: ['', Validators.required],
    start_date: [''],
    estimated_end_date: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.quoteId = Number(this.route.snapshot.paramMap.get('quoteId'));

    // Traemos la cotización solo para mostrar contexto (cliente, folio, monto)
    // en el formulario — no se manda nada de esto al backend, el backend ya
    // sabe todo lo que necesita a partir del quoteId.
    this.quoteService.getQuoteById(this.quoteId).subscribe({
      next: (res) => {
        if (res.data) {
          this.quoteData = res.data;

          // Nombre de proyecto sugerido, editable por el usuario
          this.projectForm.patchValue({
            project_name: `Proyecto ${res.data.customer_name ?? ''} — Folio ${res.data.quote_folio ?? ''}`.trim()
          });
        }
      }
    });
  }

  closeForm() {
    this.location.back();
  }

  onSubmit() {
    if (this.projectForm.invalid || this.submitting) return;

    this.submitting = true;

    this.projectService.createFromQuote(this.quoteId, this.projectForm.value).subscribe({
      next: (res) => {
        this.submitting = false;

        if (res.data?.projectId) {
          this.router.navigate(['/projects', res.data.projectId, 'execution']);
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: (err) => {
        this.submitting = false;

        if (err.status === 409) {
          alert('⚠️ Esta cotización ya tiene un proyecto asociado.');
          this.router.navigate(['/board']);
          return;
        }

        alert('❌ No se pudo crear el proyecto. Revisa la consola.');
        console.error(err);
      }
    });
  }
}