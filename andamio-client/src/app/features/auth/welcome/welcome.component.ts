import { Component, NgZone, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service'; 
import { Router } from '@angular/router';

declare var google: any;

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  ngOnInit() {
    // 1. Preparamos la conexión con tu Client ID oficial [2]
    google.accounts.id.initialize({
      client_id: '990420064714-v1g3927kpik6bo5tqjuj4qjl86dgd9ff.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    // 2. Pintamos el botón justo en el panel derecho
    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: '250' }
    );
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
      error: (err) => console.error("Fallo en la estructura", err)
    });
  }
  
  loginWithEmail() {}
  
}
