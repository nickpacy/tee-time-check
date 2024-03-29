import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router, CanActivate } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../../service/user.service';
import { IUser } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<IUser | null>(null);

  constructor(private http: HttpClient, private router: Router, private userService: UserService) { }

  register(user: {Name: string, Email: string, Password: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  forgotPassword(user: {Email: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgotPassword`, user);
  }

  changePassword(user: {UserId: number, OldPassword: string, NewPassword: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/changePassword`, user);
  }

  login(user: { Email: string, Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user).pipe(
      tap((response: any) => {
        const token = response.token;
        localStorage.setItem('auth-token', token);
        this.loadUserFromToken();
      }),
      catchError((error) => {
        console.error('Error occurred during login:', error);
        return throwError(error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  logout(): void {
    localStorage.removeItem('auth-token');
    this.userSubject.next(null);
    this.router.navigate(['/logout']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return true;
    }
    this.logout();
    return false;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwt_decode(token);
      return decodedToken.exp < Date.now().valueOf() / 1000;
    } catch (error) {
      return true;
    }
  }

  loadUserFromToken(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      try {
        const decodedToken: any = jwt_decode(token);
        this.userService.getUserById(decodedToken.userId).subscribe(user => {
          this.userSubject.next(user);
        }, error => {
          this.logout();
        });
      } catch (error) {
        this.logout();
      }
    } else {
      this.logout();
    }
  }

  getUser(): Observable<IUser | null> {
    return this.userSubject.asObservable();
  }

  getUserId(): number | null {
    const currentUser = this.userSubject.value;
    return currentUser ? currentUser.UserId : null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }
}
