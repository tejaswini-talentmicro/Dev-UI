import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DevUser, initials } from '../models';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  template: `<span class="avatar" [class.wide]="wide()">{{ letters() }}</span>`,
  styles: [
    `
      .avatar {
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: #2d4a3e;
        color: #fff8ef;
        font: 500 1.1rem 'Fraunces', Georgia, serif;
      }

      .avatar.wide {
        background: #c96f53;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  readonly user = input.required<Partial<DevUser>>();
  readonly tone = input<'forest' | 'clay'>('forest');

  protected readonly letters = computed(() => initials(this.user()));
  protected readonly wide = computed(() => this.tone() === 'clay');
}
