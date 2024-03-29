import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: "root",
})
export class FriendService {
  private apiUrl = `${environment.apiUrl}/friends`;

  constructor(private http: HttpClient) {}

  getFriends(status?: string): Observable<any[]> {
    let url = `${this.apiUrl}`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<any[]>(url);
  }

  getPendingFriends(): Observable<any[]> {
    const url = `${this.apiUrl}/pending`;
    return this.http.get<any[]>(url);
  }

  createFriendship(friendId: number): Observable<any> {
    const body = {friendId: friendId}
    return this.http.post<any>(this.apiUrl, body);
  }

  updateFriendship(friendshipId: number, status: any): Observable<any> {
    const friendship = {status: status};
    const url = `${this.apiUrl}/${friendshipId}`;
    return this.http.put<any>(url, friendship);
  }

  deleteFriend(courseId: number): Observable<any> {
    const url = `${this.apiUrl}/${courseId}`;
    return this.http.delete(url);
  }
}