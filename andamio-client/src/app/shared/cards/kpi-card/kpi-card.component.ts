import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [
    LucideAngularModule
  ],
  template: `
<div class="kpi-card">

    <div class="kpi-icon">
        <lucide-icon
            [img]="icon"
            size="24">
        </lucide-icon>
    </div>

    <div class="kpi-content">

        <span class="kpi-title">
            {{ title }}
        </span>

        <h2 class="kpi-value">
            {{ value }}
        </h2>

        @if(subtitle){

            <span class="kpi-subtitle">
                {{ subtitle }}
            </span>

        }

    </div>

</div>
`,
  styleUrls: ['./kpi-card.component.css']
})
export class KpiCardComponent {

  @Input() icon!: any;

  @Input() title = '';

  @Input() value: string | number = 0;

  @Input() subtitle: string = '';
}