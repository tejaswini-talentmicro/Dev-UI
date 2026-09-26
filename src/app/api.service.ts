import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionRequest, DevUser, FeedResponse, ListResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  signup(payload: {
    firstName: string;
    LastName: string;
    emailId: string;
    password: string;
  }): Observable<string> {
    return this.http.post(`${this.baseUrl}/signup`, payload, { responseType: 'text' });
  }

  login(credentials: { emailId: string; password: string }): Observable<string> {
    return this.http.post(`${this.baseUrl}/login`, credentials, { responseType: 'text' });
  }

  logout(): Observable<string> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { responseType: 'text' });
  }

  getFeed(page = 1, limit = 10): Observable<FeedResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<FeedResponse>(`${this.baseUrl}/user/feed`, { params });
  }

  sendRequest(status: 'interested' | 'ignored', toUserId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/request/send/${status}/${toUserId}`, {});
  }

  getReceivedRequests(): Observable<ListResponse<ConnectionRequest>> {
    return this.http.get<ListResponse<ConnectionRequest>>(`${this.baseUrl}/user/requests/received`);
  }

  getConnections(): Observable<ListResponse<DevUser>> {
    return this.http.get<ListResponse<DevUser>>(`${this.baseUrl}/user/connections`);
  }

  reviewRequest(status: 'accepted' | 'rejected', requestId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/review/send/${status}/${requestId}`, {});
  }
}
