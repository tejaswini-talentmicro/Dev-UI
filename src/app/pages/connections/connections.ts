import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { UserAvatarComponent } from '../../shared/user-avatar';
import { DevUser, apiError, displayName } from '../../models';

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [UserAvatarComponent],
  templateUrl: './connections.html',
  styleUrl: './connections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsPage {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly connections = signal<DevUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly items = computed(() =>
    this.connections().map((user) => ({
      user,
      name: displayName(user),
    })),
  );
  protected readonly empty = computed(() => !this.loading() && this.items().length === 0);

  constructor() {
    this.api
      .getConnections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.connections.set(response.data ?? []);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Could not load matches.'));
        },
      });
  }
}
