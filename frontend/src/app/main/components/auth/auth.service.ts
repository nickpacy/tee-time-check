import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../../service/user.service';
import { IUser } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; // Replace with your API URL
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<IUser | null>(null);

  constructor(private http: HttpClient,
              private router: Router,
              private userService: UserService) { }

  register(user: {Name: string,  Email: string, Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  forgotPassword(user: {Email: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgotPassword`, user);
  }

  changePassword(user: {UserId: number,  OldPassword: string, NewPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/changePassword`, user);
  }

  login(user: { Email: string, Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user).pipe(
      tap((response: any)=> {
        const token = response.token;
        const user: IUser = response.user;
        localStorage.setItem('authToken', token);
        this.tokenSubject.next(token);
        this.userSubject.next(user);
      }),
      catchError((error) => {
        console.error('Error occurred during login:', error);
        throw error;
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.router.navigate(['/logout']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    // return !!token;
    if (!token) {
        console.log("NO TOKEN");
        return false;
    }
    try {
        const decodedToken: any = jwt_decode(token);
        const now = Date.now().valueOf() / 1000; // Convert to seconds
        if (typeof decodedToken.exp !== 'undefined' && decodedToken.exp < now) {
            console.log("TOKEN EXPIRED");
            return false; // Token has expired
        }
        return true;
    } catch (error) {
        console.log("INVALID TOKEN");
        return false; // Token is invalid
    }
  }

  getTokenSubject(): BehaviorSubject<string | null> {
    return this.tokenSubject;
  }

  getCurrentUser(): IUser | null {
    console.log("getCurrentUser", this.userSubject.value);
    return this.userSubject.value;
  }

  getUser(): Observable<IUser | null> {
    return this.userSubject.asObservable();
  }

  getUserId(): number {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwt_decode(token);
        return Number(decodedToken._id);  // this assumes your userId is stored with '_id' key in the token payload
      } catch (error) {
        console.log("INVALID TOKEN");
        return 0; // Token is invalid
      }
    } else {
      console.log("NO TOKEN");
      return 0; // No token
    }
  }

  loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwt_decode(token);
        const userId = decodedToken._id;  // this assumes your userId is stored with '_id' key in the token payload
        this.userService.getUserById(userId).subscribe(user => {this.userSubject.next(user)});
      } catch (error) {
        console.log("INVALID TOKEN");
        // Handle error here
      }
    } else {
      console.log("NO TOKEN");
      // Handle no token situation here
      this.logout();
    }
  }

}

@Injectable({
    providedIn: 'root'
  })
export class AuthGuard implements CanActivate {
    constructor(
      private authService: AuthService,
      private router: Router
    ) {}
  
    canActivate(
      next: ActivatedRouteSnapshot,
      state: RouterStateSnapshot
    ): boolean {
      if (this.authService.isLoggedIn()) {
        return true;
      } else {
        this.router.navigate(['/auth/login']);
        return false;
      }
    }
  }
