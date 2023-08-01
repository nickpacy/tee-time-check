import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; // Replace with your API URL
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  register(user: {Name: string,  Email: string, Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(user: { Email: string, Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user).pipe(
      tap((response: any)=> {
        const token = response.token;
        localStorage.setItem('authToken', token);
        this.tokenSubject.next(token);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.tokenSubject.next(null);
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
