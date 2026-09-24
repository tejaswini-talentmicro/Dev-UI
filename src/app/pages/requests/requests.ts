import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { UserAvatarComponent } from '../../shared/user-avatar';
import { ConnectionRequest, DevUser, apiError, displayName } from '../../models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [UserAvatarComponent],
  templateUrl: './requests.html',
  styleUrl: './requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly requests = signal<ConnectionRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly actingId = signal('');

  protected readonly items = computed(() =>
    this.requests().map((request) => {
      const sender = this.sender(request);
      return {
        request,
        sender,
        name: displayName(sender),
      };
    }),
  );
  protected readonly empty = computed(() => !this.loading() && this.items().length === 0);

  constructor() {
    this.refresh();
  }

  protected review(status: 'accepted' | 'rejected', request: ConnectionRequest): void {
    this.actingId.set(request._id);
    this.api
      .reviewRequest(status, request._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests.update((items) => items.filter((item) => item._id !== request._id));
          this.actingId.set('');
        },
        error: (error) => {
          this.actingId.set('');
          this.error.set(apiError(error, 'Could not update that request.'));
        },
      });
  }

  private sender(request: ConnectionRequest): Partial<DevUser> {
    return typeof request.fromUserId === 'string' ? { firstName: 'Developer' } : request.fromUserId;
  }

  private refresh(): void {
    this.api
      .getReceivedRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.requests.set(response.data ?? []);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Could not load requests.'));
        },
      });
  }
}
