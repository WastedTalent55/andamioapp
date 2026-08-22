import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-execution',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-execution.component.html',
  styleUrl: './project-execution.component.css'
})
export class ProjectExecutionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  project: Project | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}