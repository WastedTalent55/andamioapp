import { Component, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service'; 
import { Router } from '@angular/router';
import { 
  LucideAngularModule,
  Users,
  ClipboardList,
  FileText,
  Hammer 
} from 'lucide-angular';

declare var google: any;

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonModule
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  Users = Users;
  ClipboardList = ClipboardList;
  FileText = FileText;
  Hammer = Hammer;


  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  googleLoadFailed = false;

  ngAfterViewInit() {
    this.waitForGoogleAndRender();
  }

  // El script de Google carga con async/defer, así que puede no estar listo
  // todavía cuando el componente arranca (más común en Safari/iOS, que además
  // lo carga más despacio por sus protecciones de privacidad). Reintentamos
  // durante unos segundos en vez de asumir que ya está disponible.
  private waitForGoogleAndRender(intentos = 0) {
    const listo = typeof google !== 'undefined' && google?.accounts?.id;

    if (listo) {
      google.accounts.id.initialize({
        client_id: '990420064714-v1g3927kpik6bo5tqjuj4qjl86dgd9ff.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      const contenedor = document.getElementById('google-btn');
      if (contenedor) {
        google.accounts.id.renderButton(
          contenedor,
          { theme: 'outline', size: 'large', width: '250' }
        );
      }
      return;
    }

    if (intentos < 20) {
      // hasta 20 intentos cada 250ms = 5 segundos de margen
      setTimeout(() => this.waitForGoogleAndRender(intentos + 1), 250);
    } else {
      console.error('El script de Google (accounts.google.com/gsi/client) no cargó a tiempo.');
      this.ngZone.run(() => { this.googleLoadFailed = true; });
    }
  }

  handleGoogleLogin(response: any) {
    // 3. Enviamos el token al backend para crear el Tenant y el Usuario 
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res) => {
        console.log("¡Andamio activado!", res);
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        console.error("Fallo en la estructura", err);
        const detalle = err?.error?.error || err?.error?.message || err?.message || 'No se pudo conectar con el servidor.';
        alert(`No se pudo iniciar sesión: ${detalle}`);
      }
    });
  }
  
  loginWithEmail() {}
  
}