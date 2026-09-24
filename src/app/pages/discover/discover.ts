import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { DevUser, apiError, displayName, initials } from '../../models';

type SwipeStatus = 'interested' | 'ignored';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './discover.html',
  styleUrl: './discover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverPage {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly feed = signal<DevUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly toast = signal('');
  protected readonly dragX = signal(0);
  protected readonly dragY = signal(0);
  protected readonly flying = signal<SwipeStatus | null>(null);
  protected readonly snapping = signal(false);
  protected readonly busy = signal(false);

  private readonly page = signal(1);
  private readonly seen = signal(new Set<string>());
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private pointerId: number | null = null;

  protected readonly current = computed(() => this.feed()[0] ?? null);
  protected readonly upcoming = computed(() => this.feed().slice(1, 3));
  protected readonly empty = computed(() => !this.loading() && !this.current());
  protected readonly likeOpacity = computed(() => Math.min(Math.max(this.dragX() / 120, 0), 1));
  protected readonly passOpacity = computed(() => Math.min(Math.max(-this.dragX() / 120, 0), 1));
  protected readonly cardTransform = computed(() => {
    const x = this.dragX();
    const y = this.dragY();
    return `translate(${x}px, ${y}px) rotate(${x / 18}deg)`;
  });

  protected readonly nameOf = displayName;
  protected readonly initialsOf = initials;

  constructor() {
    this.loadFeed();
  }

  protected palette(id: string): string {
    const palettes = [
      'linear-gradient(160deg, #2d4a3e, #c96f53)',
      'linear-gradient(160deg, #1e3a4c, #d4a373)',
      'linear-gradient(160deg, #3d2c4a, #e07a5f)',
      'linear-gradient(160deg, #24443a, #81b29a)',
      'linear-gradient(160deg, #4a3728, #c96f53)',
    ];
    const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return palettes[index % palettes.length];
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.flying() || !this.current()) {
      return;
    }

    this.dragging = true;
    this.snapping.set(false);
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.pointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    this.dragX.set(event.clientX - this.startX);
    this.dragY.set(event.clientY - this.startY);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    this.dragging = false;
    this.pointerId = null;
    const x = this.dragX();

    if (x > 110) {
      this.swipe('interested');
      return;
    }
    if (x < -110) {
      this.swipe('ignored');
      return;
    }

    this.snapping.set(true);
    this.dragX.set(0);
    this.dragY.set(0);
  }

  @HostListener('window:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.swipe('interested');
    }
    if (event.key === 'ArrowLeft') {
      this.swipe('ignored');
    }
  }

  protected swipe(status: SwipeStatus): void {
    const user = this.current();
    if (!user || this.flying() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.flying.set(status);
    this.dragX.set(status === 'interested' ? 420 : -420);
    this.dragY.set(24);

    this.api
      .sendRequest(status, user._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.set(
            status === 'interested' ? `You liked ${displayName(user)}` : `Passed on ${displayName(user)}`,
          );
          this.finishSwipe();
        },
        error: (error) => {
          this.error.set(apiError(error, 'Could not save that swipe.'));
          this.finishSwipe();
        },
      });
  }

  private finishSwipe(): void {
    window.setTimeout(() => {
      this.feed.update((users) => users.slice(1));
      this.flying.set(null);
      this.busy.set(false);
      this.dragX.set(0);
      this.dragY.set(0);
      window.setTimeout(() => this.toast.set(''), 1600);

      if (this.feed().length <= 2) {
        this.loadFeed();
      }
    }, 280);
  }

  private loadFeed(): void {
    if (this.page() > 1 && this.feed().length === 0) {
      this.loading.set(true);
    }

    this.api
      .getFeed(this.page(), 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const seen = this.seen();
          const incoming = (response.data ?? []).filter((user) => {
            if (seen.has(user._id)) {
              return false;
            }
            seen.add(user._id);
            return true;
          });
          this.seen.set(new Set(seen));
          this.feed.update((users) => [...users, ...incoming]);
          this.loading.set(false);
          if (incoming.length) {
            this.page.update((page) => page + 1);
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Could not load developers.'));
        },
      });
  }
}
