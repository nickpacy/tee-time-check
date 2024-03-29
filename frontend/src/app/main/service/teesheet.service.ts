import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: "root",
})
export class TeeSheetService {
  private apiUrl = `${environment.apiUrl}/teesheet`;

  constructor(private http: HttpClient) {}

  getTeeTimes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTeeTimeById(teeSheetId: number): Observable<any> {
    const url = `${this.apiUrl}/${teeSheetId}`;
    return this.http.get<any>(url);
  }

  getTeeTimePlayers(teeSheetId: number): Observable<any> {
    const url = `${this.apiUrl}/players/${teeSheetId}`;
    return this.http.get<any>(url);
  }

  createTeeTime(teeTimeData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, teeTimeData);
  }

  addGuestPlayer(teeSheetId: number, guestName: string): Observable<any> {
    const playerData = {teeSheetId: teeSheetId, guestName: guestName}
    return this.http.post<any>(`${this.apiUrl}/addGuestPlayer`, playerData);
  }
  
  addFriendsToNotificationQueue(teeSheetId: number, friends: any[]): Observable<any> {
    const data = {teeSheetId: teeSheetId, friends: friends}
    return this.http.post<any>(`${this.apiUrl}/addFriendsToNotificationQueue`, data);
  }

  updateQueueStatus(teeSheetId: number, userId: number, status: string): Observable<any> {
    const data = {teeSheetId: teeSheetId, userId: userId, status: status}
    return this.http.post<any>(`${this.apiUrl}/updateQueueStatus`, data);
  }

  addFriendPlayer(teeSheetId: number, userId: number): Observable<any> {
    const playerData = {teeSheetId: teeSheetId, userId: userId}
    return this.http.post<any>(`${this.apiUrl}/addFriendPlayer`, playerData);
  }

  removePlayer(teeSheetPlayerId: number): Observable<any> {
    const url = `${this.apiUrl}/removePlayer/${teeSheetPlayerId}`;
    return this.http.delete<any>(url);
  }

  updateTeeTime(teeSheetId: number, teeTimeData: any): Observable<any> {
    const url = `${this.apiUrl}/${teeSheetId}`;
    return this.http.put<any>(url, teeTimeData);
  }

  deleteTeeTime(teeSheetId: number): Observable<any> {
    const url = `${this.apiUrl}/${teeSheetId}`;
    return this.http.delete<any>(url);
  }
}
