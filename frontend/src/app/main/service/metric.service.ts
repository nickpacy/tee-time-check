import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, UserCourse } from '../models/course.model';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class MetricService {
  private apiUrl = `${environment.apiUrl}/metrics`;

  constructor(private http: HttpClient) {}

  getNotificationsByCourse(weekLookback = 12): Observable<any> {
    const url = `${this.apiUrl}/notificationsByCourse`;
    var body = {lookback: weekLookback};
    return this.http.post<any>(url, body);
  }

}