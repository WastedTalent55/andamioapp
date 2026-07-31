import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="kpi-card">
      <div class="kpi-icon">{{ icon }}</div>

      <div class="kpi-content">
        <span class="kpi-title">{{ title }}</span>
        <h2 class="kpi-value">{{ value }}</h2>
      </div>
    </div>
  `,
  styleUrls: ['./kpi-card.component.css']
})
export class KpiCardComponent {

  @Input() icon = '';

  @Input() title = '';

  @Input() value: string | number = 0;

}