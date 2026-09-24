export interface Session {
  emailId: string;
  firstName?: string;
  lastName?: string;
}

export interface DevUser {
  _id: string;
  firstName: string;
  LastName?: string;
  lastName?: string;
  keySkills?: string[];
  age?: number;
}

export interface FeedResponse {
  data: DevUser[];
}

export interface ConnectionRequest {
  _id: string;
  status: string;
  fromUserId: DevUser | string;
  toUserId?: DevUser | string;
}

export interface ListResponse<T> {
  message?: string;
  data: T[];
}

export function displayName(user: Partial<DevUser> | null | undefined): string {
  if (!user) {
    return 'Developer';
  }

  return [user.firstName, user.LastName || user.lastName].filter(Boolean).join(' ') || 'Developer';
}

export function initials(user: Partial<DevUser> | null | undefined): string {
  const first = user?.firstName?.[0] ?? 'D';
  const last = (user?.LastName || user?.lastName)?.[0] ?? 'T';
  return (first + last).toUpperCase();
}

export function apiError(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  const body = (error as { error?: unknown })?.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}
