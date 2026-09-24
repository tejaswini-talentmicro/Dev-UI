import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import { apiError } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loginForm = new FormGroup({
    emailId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly submitted = signal(false);

  private readonly formStatus = toSignal(this.loginForm.statusChanges, {
    initialValue: this.loginForm.status,
  });

  protected readonly showFieldErrors = computed(() => this.submitted() && this.formStatus() === 'INVALID');

  protected login(): void {
    this.submitted.set(true);
    this.loginForm.markAllAsTouched();
    this.error.set('');

    if (this.loginForm.invalid || this.loading()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.loading.set(true);

    this.api
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.auth.setSession({ emailId: credentials.emailId });
          this.loading.set(false);
          void this.router.navigate(['/discover']);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Login failed. Check your email and password.'));
        },
      });
  }
}
