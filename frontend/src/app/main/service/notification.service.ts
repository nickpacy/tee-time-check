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

  getNotificationsByCourse(): Observable<any> {
    let url = `${this.apiUrl}/byCourse`;
    return this.http.get<any>(url);
  }

  removeNotification(notifiedTeeTimeId: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/removeNotification/${notifiedTeeTimeId}`);
  }

}