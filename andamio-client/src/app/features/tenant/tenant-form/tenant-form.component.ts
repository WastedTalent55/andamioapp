import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  private tenantService = inject(TenantService);


  tenantForm!: FormGroup;
  logoPreview: string | null = null;


  ngOnInit() {
    this.initForm();
    this.loadTenantInfo();
  }

  private initForm() {
    this.tenantForm = this.fb.group({
      company_name: [''],
      owner_name: [''],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      bank_name: [''], 
      bank_account: [''],
      // Ajuste: 18 números exactos (0-9)
      bank_clabe: ['', [Validators.pattern('^[1-8, 10]{18}$')]], 
      logo_base64: [''] ,
    });
  }

  loadTenantInfo() {
    this.tenantService.getTenantData(1).subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data) {
          const data = res.data[0];
          // Rellenamos el formulario con lo que ya existe en MySQL
          this.tenantForm.patchValue(data);
          // Si hay logo, encendemos la vista previa
          if (data.logo) {
            this.logoPreview = data.logo;
          }
        }
      },
      error: (err: any) => console.log("Primera vez: Iniciando infraestructura desde cero.")
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
    this.tenantService.saveTenantProfile(this.tenantForm.value).subscribe({
      next: (res: any) => {
        alert('✅ INFRAESTRUCTURA ACTUALIZADA');
        
        const newName = this.tenantForm.value.company_name;
        this.tenantService.emitNewName(newName);
      },
      error: (err: any) => alert('❌ Error en el servidor')
    });
  }
}

}
