import { Routes } from '@angular/router';
import { EvaluationDetailComponent } from './features/evaluations/evaluation-detail/evaluation-detail.component';
import { EvaluationFormComponent } from './features/evaluations/evaluation-form/evaluation-form.component';
import { QuoteFormComponent } from './features/quotes/quote-form/quote-form.component';
import { QuoteListComponent } from './features/quotes/quote-list/quote-list.component';
import { DashboardComponent } from './features/dashboard/dashboard.component'; 
import { ProjectBoardComponent } from './features/board/project-board/project-board.component'; 
import { ProjectExecutionComponent } from './features/projects/project-execution/project-execution.component';
import { CustomerFormComponent } from './features/customers/customer-form/customer-form.component';
import { CustomerListComponent } from './features/customers/customer-list/customer-list.component';
import { WelcomeComponent } from './features/auth/welcome/welcome.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TenantFormComponent } from './features/tenant/tenant-form/tenant-form.component';

export const routes: Routes = [
    // 0. Flujo de Bienvenida y Acceso
    { path: '', component: WelcomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // 1. Centro de Mando y Métricas
    { path: 'dashboard', component: DashboardComponent }, 

    // 2. Gestion de formulario para nuevos client
    { path: 'customer/new', component: CustomerFormComponent },

    // 2. Gestion de lista de clientes
    { path: 'customer', component: CustomerListComponent }, 
    
    
    // 3. Gestión Visual de Flujo (El tablero tipo Trello)
    { path: 'board', component: ProjectBoardComponent }, 

    // 3. Gestión de formulario de evaluacion
    { path: 'evaluations/new', component: EvaluationFormComponent }, 
    
    // 4. Fase de Evaluación (Captura de información técnica)
    { path: 'evaluations/:id/details', component: EvaluationDetailComponent },
    
    // 5. Fase de Cotización y Versionamiento
    { path: 'evaluations/:evaluationId/create-quote', component: QuoteFormComponent },
    { path: 'quotes/new', component: QuoteFormComponent },
    { path: 'quotes', component: QuoteListComponent },
    
    // 6. Fase de Ejecución y Rentabilidad (El trabajo ya agendado)
    { path: 'projects/:id/execution', component: ProjectExecutionComponent },

    //7. Ajustes del tenant
    { path: 'settings', component: TenantFormComponent },
];