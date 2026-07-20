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
      bank_clabe: ['', [Validators.pattern('^[0-9]{18}$')]], 
      logo: [''] ,
    });
  }

  loadTenantInfo() {
    this.tenantService.getMyTenantConfig().subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data) {
          const data = res.data[0];
          this.tenantForm.patchValue(data);
          if (data.logo) {
            this.logoPreview = data.logo;
          }
        }
      },
      error: (err: any) => console.log("Primera vez: Iniciando infraestructura desde cero.")
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        this.tenantForm.patchValue({ logo: this.logoPreview });
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
