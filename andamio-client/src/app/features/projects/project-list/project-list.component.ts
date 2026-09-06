import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { ProjectCardComponent } from '../../../shared/cards/project-card/project-card.component';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ProjectCardComponent, LucideAngularModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit {
  Search = Search;

  private projectService = inject(ProjectService);
  private router = inject(Router);

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (res) => {
        this.projects = res.data || [];
        this.filteredProjects = this.projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando proyectos:', err);
        this.loading = false;
      }
    });
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();

    if (!term) {
      this.filteredProjects = this.projects;
      return;
    }

    this.filteredProjects = this.projects.filter(p =>
      p.project_name?.toLowerCase().includes(term) ||
      p.customer_name?.toLowerCase().includes(term)
    );
  }

  get totalCount(): number {
    return this.projects.length;
  }

  get activosCount(): number {
    return this.projects.filter(p => p.status === 'activo').length;
  }

  get finalizadosCount(): number {
    return this.projects.filter(p => p.status === 'finalizado').length;
  }
}