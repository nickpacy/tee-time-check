import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimecheckService {

  private baseUrl = `${environment.apiUrl}/timechecks`;

  constructor(private http: HttpClient) {}

  getTimechecks(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  getTimecheck(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<any>(url);
  }

  createTimecheck(timecheck: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, timecheck);
  }

  bulkUpdateTimechecks(timechecks: any[]): Observable<any> {
    const url = `${this.baseUrl}/bulk-update`;
    return this.http.post<any>(url, timechecks);
  }

  updateTimecheck(id: number, timecheck: any): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<any>(url, timecheck);
  }

  deleteTimecheck(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<any>(url);
  }

  getTimechecksByUserId(): Observable<any> {
    const url = `${this.baseUrl}/timechecksByUserId}`;
    return this.http.get<any>(url);
  }

  getTimechecksByUserIdAndCourseId(courseId: number): Observable<any> {
    const url = `${this.baseUrl}/timechecksByUserIdAndCourseId/${courseId}`;
    return this.http.get<any>(url);
  }
  
  getTimechecksByCourse(): Observable<any> {
    const url = `${this.baseUrl}/timechecksByCourse`;
    return this.http.get<any>(url);
  }

  getTimechecksByDay(): Observable<any> {
    const url = `${this.baseUrl}/timechecksByDay`;
    return this.http.get<any>(url);
  }

  getAllUsersActiveTimechecks(): Observable<any> {
    const url = `${this.baseUrl}/allUsersActiveTimechecks`;
    return this.http.get<any>(url);
  }

  getActiveTimecheckCountByUserId(): Observable<any> {
    const url = `${this.baseUrl}/activeTimecheckCount`;
    return this.http.get<any>(url);
  }
  
  resetTimechecks(): Observable<any> {
    const url = `${this.baseUrl}/resetTimechecks`;
    return this.http.get<any>(url);
  }

  setTimecheckInactive(timecheck: any): Observable<any> {
    const url = `${this.baseUrl}/inactive`;
    return this.http.put<any>(url, timecheck);
  }


  private handleError(error: any) {
    console.error('Error:', error);
    return throwError('An error occurred');
  }

}