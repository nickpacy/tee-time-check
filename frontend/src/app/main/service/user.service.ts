import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<any> {
    // console.log(`${this.apiUrl}/${id}`)
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/userByEmail/${email}`);
  }

  searchUsers(queryString: string): Observable<User[]> {
    const params = new HttpParams().set('q', queryString);
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
  }

  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateUserSetting(userSetting: any[]): Observable<any> {
    var settings = {settings: userSetting}
    return this.http.post(`${this.apiUrl}/userSetting`, settings);
  }

  getUserSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/userSetting`);
  }
}