import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardCardComponent } from '../../../shared/cards/board-card/board-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, BoardCardComponent],
  template: `
    <div class="board-column">
      <div class="column-header">
        <span class="column-title">{{ icon }} {{ title }}</span>
        <span class="column-count">{{ items.length || 0 }}</span>
      </div>

      <div class="column-body">
        @for (item of items; track (item.eval_id || item.quote_id)) {
          <app-board-card [data]="item" [type]="type"></app-board-card>
        } @empty {
          <div class="empty-state">No hay registros</div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./board-column.component.css']
})
export class BoardColumnComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() type: any;
  @Input() items: any[] = [];
}
