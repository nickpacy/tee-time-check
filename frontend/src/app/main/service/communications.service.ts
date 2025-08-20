import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  MessageType,
  CommStatus,
  Communication,
  CommsSummary,
  SmsCountToday,
  ListParams
} from '../models/communication.model';

@Injectable({ providedIn: 'root' })
export class CommunicationsService {
  private baseUrl = `${environment.apiUrl}/communications`;

  constructor(private http: HttpClient) {}

  private toParams(q?: ListParams): HttpParams {
    let p = new HttpParams();
    if (!q) return p;
    if (q.from)  p = p.set('from', q.from);
    if (q.to)    p = p.set('to', q.to);
    if (q.limit) p = p.set('limit', String(q.limit));
    return p;
  }

  // ===== Current user =====
  listMe(q?: ListParams): Observable<Communication[]> {
    return this.http.get<Communication[]>(`${this.baseUrl}/me`, { params: this.toParams(q) });
  }

  summaryMe(hours = 24): Observable<CommsSummary> {
    return this.http.get<CommsSummary>(`${this.baseUrl}/me/summary`, { params: new HttpParams().set('hours', String(hours)) });
  }

  smsCountTodayMe(): Observable<SmsCountToday> {
    return this.http.get<SmsCountToday>(`${this.baseUrl}/me/sms-count-today`);
  }

  // ===== By specific user (self or admin) =====
  listUser(userId: number, q?: ListParams): Observable<Communication[]> {
    return this.http.get<Communication[]>(`${this.baseUrl}/users/${userId}`, { params: this.toParams(q) });
  }

  summaryUser(userId: number, hours = 24): Observable<CommsSummary> {
    return this.http.get<CommsSummary>(`${this.baseUrl}/users/${userId}/summary`, { params: new HttpParams().set('hours', String(hours)) });
  }

  smsCountTodayUser(userId: number): Observable<SmsCountToday> {
    return this.http.get<SmsCountToday>(`${this.baseUrl}/users/${userId}/sms-count-today`);
  }

  // ===== Admin: all users =====
  listAll(q?: ListParams): Observable<Communication[]> {
    return this.http.get<Communication[]>(`${this.baseUrl}/all`, { params: this.toParams(q) });
  }

  summaryAll(hours = 24): Observable<CommsSummary> {
    return this.http.get<CommsSummary>(`${this.baseUrl}/all/summary`, { params: new HttpParams().set('hours', String(hours)) });
  }
}
