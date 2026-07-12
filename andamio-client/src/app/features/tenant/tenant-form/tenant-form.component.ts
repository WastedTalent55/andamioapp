import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  
  tenantForm!: FormGroup;
  logoPreview: string | null = null; // Para ver el logo antes de guardar

  ngOnInit() {
    this.tenantForm = this.fb.group({
      company_name: ['', Validators.required],
      owner_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      bank_name: [''], 
      bank_account: [''],
      bank_clabe: ['', [Validators.required, Validators.pattern('^[1-8, 12]{18}$')]], 
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
  // 1. Verificamos si el formulario es válido según las reglas técnicas
  if (this.tenantForm.valid) {
    console.log("Iniciando envío de infraestructura...");
    
    // 2. CONEXIÓN REAL: Quitamos los '//' y apuntamos a tu API de Node.js
    const apiUrl = 'http://localhost:3000/api/tenants/update';
    
    this.http.post(apiUrl, this.tenantForm.value).subscribe({
      next: (res) => {
        // Si todo sale bien, lanzamos el mensaje de éxito
        alert('✅ INFRAESTRUCTURA ACTUALIZADA: Tu empresa ya es profesional.');
      },
      error: (err) => {
        // Si falla la conexión con el servidor (app.js)
        console.error("Falla en la tubería:", err);
        alert('❌ ERROR DE CONEXIÓN: El servidor no responde.');
      }
    });

  } else {
    // 3. Si el formulario es inválido, avisamos qué falta
    alert('⚠️ DATOS INCOMPLETOS: Revisa que la CLABE tenga 18 números exactos.');
    
    // Tip PRO: Esto te dice en la consola (F12) exactamente qué campo está mal
    Object.keys(this.tenantForm.controls).forEach(key => {
      const controlErrors = this.tenantForm.get(key)?.errors;
      if (controlErrors) console.log('Tornillo suelto en:', key, controlErrors);
    });
  }
}
}