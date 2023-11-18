import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: "root" })
export class MetricService {
  private apiUrl = `${environment.apiUrl}/metrics`;

  constructor(private http: HttpClient) {}

  getNotificationsByCourse(weekLookback = 12): Observable<any> {
    const url = `${this.apiUrl}/notificationsByCourse`;
    let params = new HttpParams().set("weekLookback", weekLookback.toString());

    return this.http.get<any>(url, { params });
  }

  getNotificationsByCourseAndUser(startDate: Date, endDate: Date): Observable<any> {
    const url = `${this.apiUrl}/notificationsByCourseAndUser`;
    let params = new HttpParams()
      .set("startDate", this.formatDate(startDate))
      .set("endDate", this.formatDate(endDate));

    return this.http.get<any>(url, { params });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}