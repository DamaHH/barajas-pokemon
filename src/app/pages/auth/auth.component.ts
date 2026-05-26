import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #cbd5e1; position: relative; overflow: hidden; padding: 1.5rem;">
      
      <!-- Ornamental background lines -->
      <div class="royal-pattern"></div>

      <!-- Trainer ID Card (Poké-Stadium Style) -->
      <div class="altar-panel" style="width: 100%; max-width: 450px; overflow: hidden; background: #ffffff; padding: 0;">
        
        <!-- Red Header (Pokéball Top Half Aesthetic) -->
        <div style="background: var(--poke-red); padding: 1.5rem; text-align: center; border-bottom: 5px solid var(--poke-dark); position: relative;">
          <!-- Pokéball center button detail -->
          <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 50%; background: #ffffff; border: 4px solid var(--poke-dark); z-index: 10;"></div>
          
          <h2 style="font-family: var(--font-title); font-weight: 900; font-size: 1.1rem; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; margin: 0; text-shadow: 1px 1px 0 #000;">
            Tarjeta de Entrenador
          </h2>
        </div>

        <!-- Card Body -->
        <div style="padding: 2.2rem 2rem 2rem 2rem; position: relative;">
          
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <h1 class="royal-title" style="font-size: 2.2rem; margin-bottom: 0.25rem; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
              Barajas Pokémon
            </h1>
            <p style="color: #64748b; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              {{ isLoginMode ? 'Inicia sesión para ingresar a la liga' : 'Registra tus credenciales oficiales' }}
            </p>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" style="padding: 0.8rem; color: var(--poke-red); border: 2px solid var(--poke-red); background: #ffebeb; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; text-align: center; font-weight: bold;">
            ⚠️ {{ errorMessage }}
          </div>

          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            
            <!-- Trainer Nickname (Registration Only) -->
            <div *ngIf="!isLoginMode" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-family: var(--font-title); font-weight: 900; font-size: 0.75rem; color: var(--poke-dark); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Nombre de Entrenador (Apodo)</label>
              <input type="text" formControlName="username" 
                     placeholder="Ej. Damaris"
                     style="width: 100%; padding: 0.75rem; background: var(--poke-gray-bg); border: 3px solid var(--poke-dark); border-radius: 8px; color: var(--poke-dark); font-family: inherit; font-weight: bold; outline: none; transition: border-color 0.2s;">
              <span *ngIf="authForm.get('username')?.invalid && authForm.get('username')?.touched" style="font-size: 0.75rem; color: var(--poke-red); margin-top: 4px; display: block; font-weight: bold;">Mínimo 3 caracteres</span>
            </div>

            <!-- Email Address -->
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-family: var(--font-title); font-weight: 900; font-size: 0.75rem; color: var(--poke-dark); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Correo de Enlace</label>
              <input type="email" formControlName="email" 
                     placeholder="ejemplo@correo.com"
                     style="width: 100%; padding: 0.75rem; background: var(--poke-gray-bg); border: 3px solid var(--poke-dark); border-radius: 8px; color: var(--poke-dark); font-family: inherit; font-weight: bold; outline: none; transition: border-color 0.2s;">
              <span *ngIf="authForm.get('email')?.invalid && authForm.get('email')?.touched" style="font-size: 0.75rem; color: var(--poke-red); margin-top: 4px; display: block; font-weight: bold;">Ingresa un correo electrónico válido</span>
            </div>

            <!-- Password -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-family: var(--font-title); font-weight: 900; font-size: 0.75rem; color: var(--poke-dark); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Contraseña Secreta</label>
              <input type="password" formControlName="password" 
                     placeholder="******"
                     style="width: 100%; padding: 0.75rem; background: var(--poke-gray-bg); border: 3px solid var(--poke-dark); border-radius: 8px; color: var(--poke-dark); font-family: inherit; font-weight: bold; outline: none; transition: border-color 0.2s;">
              <span *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched" style="font-size: 0.75rem; color: var(--poke-red); margin-top: 4px; display: block; font-weight: bold;">Mínimo 6 caracteres</span>
            </div>

            <!-- Submission Button -->
            <button type="submit" class="btn-royal-crimson" style="width: 100%; padding: 0.9rem;" [disabled]="authForm.invalid || loading">
              {{ loading ? 'Sincronizando...' : (isLoginMode ? 'Ingresar al Estadio' : 'Registrar Entrenador') }}
            </button>
          </form>

          <!-- Toggle link -->
          <div style="text-align: center; margin-top: 1.75rem; border-top: 2px solid #e2e8f0; padding-top: 1.25rem;">
            <button type="button" (click)="toggleMode()" style="background: none; border: none; color: #64748b; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: bold; text-decoration: underline;" onmouseover="this.style.color='var(--poke-blue)'" onmouseout="this.style.color='#64748b'">
              {{ isLoginMode ? '¿Nuevo entrenador? Registrar apodo y correo' : '¿Ya tienes una cuenta? Iniciar sesión' }}
            </button>
          </div>

        </div>

      </div>
    </div>
  `
})
export class AuthComponent {
  isLoginMode = true;
  loading = false;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private audio = inject(AudioService);
  private router = inject(Router);

  authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    username: ['']
  });

  toggleMode() {
    this.audio.playClick();
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.authForm.reset();
    if (this.isLoginMode) {
      this.authForm.get('username')?.clearValidators();
    } else {
      this.authForm.get('username')?.setValidators([Validators.required, Validators.minLength(3)]);
    }
    this.authForm.get('username')?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.audio.playClick();
    const { email, password, username } = this.authForm.value;

    try {
      if (this.isLoginMode) {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        this.router.navigate(['/home']);
      } else {
        // Registrar pasándole la metadata de usuario username a Supabase Auth
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        });
        if (error) throw error;
        
        // Si no hay confirmación de email (o ya se creó), insertamos localmente por seguridad
        if (data.user) {
          try {
            await this.supabase.client.from('usuarios').insert({
              id: data.user.id,
              username: username
            });
          } catch (dbErr) {
            // Silenciar errores de inserción por si se requiere confirmación por email
            console.warn("No se pudo insertar en la base de datos de inmediato. Se creará al iniciar sesión.", dbErr);
          }
        }
        
        alert('Credenciales registradas. Si se requiere validación por correo, por favor revisa tu bandeja de entrada antes de iniciar sesión.');
        this.isLoginMode = true;
        this.toggleMode();
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Error en la conexión con el servidor';
    } finally {
      this.loading = false;
    }
  }
}
