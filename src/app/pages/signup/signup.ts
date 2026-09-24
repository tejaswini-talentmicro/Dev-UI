import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import { apiError } from '../../models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly signupForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    LastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    emailId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
  });

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly submitted = signal(false);

  private readonly formStatus = toSignal(this.signupForm.statusChanges, {
    initialValue: this.signupForm.status,
  });

  protected readonly showFieldErrors = computed(() => this.submitted() && this.formStatus() === 'INVALID');

  protected signup(): void {
    this.submitted.set(true);
    this.signupForm.markAllAsTouched();
    this.error.set('');

    if (this.signupForm.invalid || this.loading()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    const value = this.signupForm.getRawValue();
    this.loading.set(true);

    this.api
      .signup(value)
      .pipe(
        switchMap(() => this.api.login({ emailId: value.emailId, password: value.password })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.auth.setSession({
            emailId: value.emailId,
            firstName: value.firstName,
            lastName: value.LastName,
          });
          this.loading.set(false);
          void this.router.navigate(['/discover']);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Could not create your account.'));
        },
      });
  }
}
