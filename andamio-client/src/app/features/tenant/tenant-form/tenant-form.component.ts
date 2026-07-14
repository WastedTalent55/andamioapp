import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-form.component.html',
  styleUrls: ['./tenant-form.component.css']
})
export class TenantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private tenantService = inject(TenantService); 

  
  tenantForm!: FormGroup;
  logoPreview: string | null = null; 

  ngOnInit() {
    this.tenantForm = this.fb.group({
      company_name: [''],
      owner_name: [''],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      bank_name: [''], 
      bank_account: [''],
      bank_clabe: ['', [Validators.pattern('^[1-8, 10]{18}$')]],
      logo_base64: [''] ,
    });
  }

  // Lógica para capturar y procesar el logo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        this.tenantForm.patchValue({ logo_base64: this.logoPreview });
      };
      reader.readAsDataURL(file);
    }
  }
  
  saveTenant() {
  if (this.tenantForm.valid) {
    console.log("Soldando infraestructura de empresa...");
    
    // Invocamos el nuevo método que creamos en el TenantService
    this.tenantService.saveTenantProfile(this.tenantForm.value).subscribe({
      next: (res: any) => {
        alert('✅ INFRAESTRUCTURA ACTUALIZADA');
      },
      error: (err: any) => {
        console.error('Falla en la tubería:', err);
        alert('❌ ERROR: El servidor no responde. Revisa tu app.js.');
      }
    });
  } else {
    // Si el formulario es inválido, mostramos feedback de "Alta Visibilidad"
    alert('⚠️ DATOS INCOMPLETOS: Revisa que la CLABE tenga 18 números (0-9).');
    
    // Tip: Revisa la consola (F12) para ver qué campo está fallando
    Object.keys(this.tenantForm.controls).forEach(key => {
      const controlErrors = this.tenantForm.get(key)?.errors;
      if (controlErrors) console.log('Tornillo suelto en:', key, controlErrors);
    });
  }
}
}