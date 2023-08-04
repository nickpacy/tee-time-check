import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getNotificationById(notificationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${notificationId}`);
  }

  getNotificationsByUserId(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/byUser/${userId}`);
  }

  createNotification(notification: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, notification);
  }

  removeNotification(notification: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/removeNotification`, notification);
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${notificationId}`);
  }

}