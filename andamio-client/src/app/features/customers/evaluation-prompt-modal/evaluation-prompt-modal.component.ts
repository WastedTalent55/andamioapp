import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CalendarClock, UserCheck } from 'lucide-angular';

@Component({
  selector: 'app-evaluation-prompt-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './evaluation-prompt-modal.component.html',
  styleUrl: './evaluation-prompt-modal.component.css'
})
export class EvaluationPromptModalComponent {
  X = X;
  CalendarClock = CalendarClock;
  UserCheck = UserCheck;

  @Input() customerName = '';

  // El cliente ya quedó guardado en cualquiera de los dos casos —
  // esto solo decide a dónde navegar después.
  @Output() scheduleEvaluation = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();

  // Evita que un clic dentro de la tarjeta cierre el modal (el backdrop sí lo cierra)
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // Cerrar (X o backdrop) equivale a "solo guardar" — el cliente ya se guardó,
  // no hay nada que perder.
  close() {
    this.skip.emit();
  }

  chooseSchedule() {
    this.scheduleEvaluation.emit();
  }

  chooseSkip() {
    this.skip.emit();
  }
}