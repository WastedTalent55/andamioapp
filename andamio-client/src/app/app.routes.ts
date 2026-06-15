import { Routes } from '@angular/router';
import { EvaluationDetailComponent } from './features/evaluations/evaluation-detail/evaluation-detail.component';
import { QuoteEditComponent } from './features/quotes/quote-edit/quote-edit.component';
import { QuoteListComponent } from './features/quotes/quote-list/quote-list.component';

export const routes: Routes = [
    { 
        path: 'evaluations/:id/details', 
        component: EvaluationDetailComponent 
    },
    { 
        path: 'evaluations/:id/create-quote', 
        component: QuoteEditComponent 
    },
    { 
        path: 'quotes', 
        component: QuoteListComponent 
    }
];
