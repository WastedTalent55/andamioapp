import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <h1 class="brand-heading">{{ title }}</h1>
      
      @if (buttonLabel) {
        <button class="btn-andamio" (click)="onButtonClick.emit()">
          <span class="plus-icon">+</span> {{ buttonLabel }}
        </button>
      }
    </header>
  `,
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() buttonLabel: string = '';
  @Output() onButtonClick = new EventEmitter<void>();
}