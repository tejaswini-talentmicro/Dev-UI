import { Injectable, computed, signal } from '@angular/core';
import { Session } from './models';

const STORAGE_KEY = 'devtinder.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<Session | null>(this.readSession());
  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly displayName = computed(() => {
    const session = this.sessionState();
    if (!session) {
      return '';
    }
    return [session.firstName, session.lastName].filter(Boolean).join(' ') || session.emailId;
  });

  setSession(session: Session): void {
    this.sessionState.set(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    this.sessionState.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private readSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
