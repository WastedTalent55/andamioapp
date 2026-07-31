import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {

  @Input() label = '';

  @Input() color: 'blue' | 'green' | 'yellow' | 'gray' | 'red' = 'gray';

}