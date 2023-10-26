import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimecheckService {

  private baseUrl = `${environment.apiUrl}/timechecks`;

  constructor(private http: HttpClient) {}

  getTimechecks(): Observable<any> {
    return this.http.get<any>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getTimecheck(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  createTimecheck(timecheck: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, timecheck).pipe(
      catchError(this.handleError)
    );
  }

  bulkUpdateTimechecks(timechecks: any[]): Observable<any> {
    const url = `${this.baseUrl}/bulk-update`;
    return this.http.post<any>(url, timechecks).pipe(
      catchError(this.handleError)
    );
  }

  updateTimecheck(id: number, timecheck: any): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<any>(url, timecheck).pipe(
      catchError(this.handleError)
    );
  }

  deleteTimecheck(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getTimechecksByUserId(): Observable<any> {
    const url = `${this.baseUrl}/timechecksByUserId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getTimechecksByUserIdAndCourseId(courseId: number): Observable<any> {
    const url = `${this.baseUrl}/timechecksByUserIdAndCourseId/${courseId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
  
  getTimechecksByCourse(): Observable<any> {
    const url = `${this.baseUrl}/timechecksByCourse`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
  
  getAllUsersActiveTimechecks(): Observable<any> {
    const url = `${this.baseUrl}/allUsersActiveTimechecks`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getActiveTimecheckCountByUserId(): Observable<any> {
    const url = `${this.baseUrl}/activeTimecheckCount`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
  
  resetTimechecks(): Observable<any> {
    const url = `${this.baseUrl}/resetTimechecks`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  setTimecheckInactive(timecheck: any): Observable<any> {
    const url = `${this.baseUrl}/inactive`;
    return this.http.put<any>(url, timecheck).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: any) {
    console.error('Error:', error);
    return throwError('An error occurred');
  }

}