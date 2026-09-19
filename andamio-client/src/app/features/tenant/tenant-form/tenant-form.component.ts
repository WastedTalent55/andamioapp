import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';
import { LucideAngularModule, Camera, CircleCheck } from 'lucide-angular';


@Component({
selector: 'app-tenant-form',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
templateUrl: './tenant-form.component.html',
styleUrls: ['./tenant-form.component.css']
})
export class TenantFormComponent implements OnInit {
  Camera = Camera;
  CircleCheck = CircleCheck;

  // Texto fijo que se guarda en 'address' cuando marcan "Sin dirección física"
  readonly NO_ADDRESS_TEXT = 'Sin dirección física';

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
      no_physical_address: [false], // 🆕 no es columna real, solo controla el UI
      bank_name: [''], 
      bank_account: [''],
      bank_clabe: ['', [Validators.pattern('^[0-9]{18}$')]], 
      terms_conditions: [''],
      brand_color: ['#FFB800'],
      logo: [''],
      social_media: [''],
    });
  }

  // 🆕 Al marcar/desmarcar el checkbox, fija (o libera) el texto de 'address'
  onNoPhysicalAddressChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const addressControl = this.tenantForm.get('address');

    if (checked) {
      addressControl?.setValue(this.NO_ADDRESS_TEXT);
      addressControl?.disable();
    } else {
      addressControl?.setValue('');
      addressControl?.enable();
    }
  }

  loadTenantInfo() {
    this.tenantService.getMyTenantConfig().subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data) {
          const data = res.data[0];
          this.tenantForm.patchValue(data);

          // 🆕 Si lo que ya está guardado coincide con el texto fijo, restauramos
          // el estado del checkbox y bloqueamos el input, como si lo acabaran de marcar
          if (data.address === this.NO_ADDRESS_TEXT) {
            this.tenantForm.get('no_physical_address')?.setValue(true);
            this.tenantForm.get('address')?.disable();
          }

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
    this.tenantService.saveTenantProfile(this.tenantForm.getRawValue()).subscribe({
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