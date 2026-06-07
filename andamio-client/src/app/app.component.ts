import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomerListComponent } from './features/customers/customer-list/customer-list.component';
import { CommonModule } from '@angular/common';
import { CustomerFormComponent } from './features/customers/customer-form/customer-form.component';
import { EvaluationFormComponent } from './features/evaluations/evaluation-form/evaluation-form.component';
import { EvaluationListComponent } from './features/evaluations/evaluation-list/evaluation-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,
            RouterOutlet, 
            CustomerListComponent, 
            CustomerFormComponent, 
            EvaluationFormComponent,
            EvaluationListComponent
          ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'andamio-client';
}
