import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoadingService } from '../../service/loading.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,
              private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    this.loadingService.show();
    const token = this.authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
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
      }), finalize(() => {
        this.loadingService.hide();
      })
    );
  }
}