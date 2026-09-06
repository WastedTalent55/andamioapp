import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../../core/models/project.model';
import { LucideAngularModule, HardHat, Phone, MapPin, Calendar, Wallet } from 'lucide-angular';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css'
})
export class ProjectCardComponent {
  HardHat = HardHat;
  Phone = Phone;
  MapPin = MapPin;
  Calendar = Calendar;
  Wallet = Wallet;

  @Input() project!: Project;

  private router = inject(Router);

  openProject() {
    this.router.navigate(['/projects', this.project.id, 'execution']);
  }
}