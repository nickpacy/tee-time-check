import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../main/components/auth/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    // console.log("AUTH SERVICE HIT")
    const token = this.authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          'auth-token': token
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle case where user is not authenticated
          this.authService.logout();
          // Redirect user to login page or show a message
        }
        return throwError(error);
      })
    );
  }
}