import { Routes } from '@angular/router';
import { EvaluationDetailComponent } from './features/evaluations/evaluation-detail/evaluation-detail.component';
import { QuoteEditComponent } from './features/quotes/quote-edit/quote-edit.component';
import { QuoteListComponent } from './features/quotes/quote-list/quote-list.component';
// Importa los nuevos componentes que crearemos según tu visión 2.0
// import { DashboardComponent } from './features/dashboard/dashboard.component';
// import { ProjectBoardComponent } from './features/board/project-board.component';
// import { ProjectExecutionComponent } from './features/projects/project-execution/project-execution.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    
    // 1. Centro de Mando y Métricas
    //{ path: 'dashboard', component: DashboardComponent }, 
    
    // 2. Gestión Visual de Flujo (El tablero tipo Trello)
    //{ path: 'board', component: ProjectBoardComponent }, 
    
    // 3. Fase de Evaluación (Captura de información técnica)
    { path: 'evaluations/:id/details', component: EvaluationDetailComponent },
    
    // 4. Fase de Cotización y Versionamiento
    { path: 'evaluations/:id/create-quote', component: QuoteEditComponent },
    { path: 'quotes', component: QuoteListComponent },
    
    // 5. Fase de Ejecución y Rentabilidad (El trabajo ya agendado)
    //{ path: 'projects/:id/execution', component: ProjectExecutionComponent }
];