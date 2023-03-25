import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimecheckService {

  private baseUrl = 'http://localhost:5050/timechecks';

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

  getTimechecksByUserId(userId: number): Observable<any> {
    const url = `${this.baseUrl}/timechecksByUserId/${userId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Error:', error);
    return throwError('An error occurred');
  }

}