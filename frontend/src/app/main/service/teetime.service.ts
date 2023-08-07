import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models/course.model';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {
  private apiUrl = `${environment.apiUrl}/teetimes`;

  constructor(private http: HttpClient) {}

  globalSearch(searchData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/teetimesearch`, searchData);
  }
}