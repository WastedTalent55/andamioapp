import { Component, OnInit, inject } from '@angular/core'; 
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router'; 

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit { 
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    google.accounts.id.initialize({
      client_id: '990420064714-v1g3927kpik6bo5tqjuj4qjl86dgd9ff.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }

  handleGoogleLogin(response: any) {
    console.log("Token real recibido de Google:", response.credential);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res) => {
        console.log("¡Andamio nivelado! Usuario y Tenant creados [Artifact 5].", res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("Fallo en la estructura de conexión:", err);
        alert("Hubo un error al crear tu cuenta. Revisa la consola.");
      }
    });
  }

  signUpWithEmail(){};
}