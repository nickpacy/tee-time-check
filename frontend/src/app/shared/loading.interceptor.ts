import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../main/service/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private whitelist = [
    /\/users\/search\.*/, // Regex pattern for URLs under /users/search
  ];

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isWhitelisted(request.url)) {
      this.loadingService.show();
    }
    // console.log("LOAD INTERCEPT");
    return next.handle(request).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    );
  }

  private isWhitelisted(url: string): boolean {
    return this.whitelist.some((pattern) => {
      return typeof pattern === 'string' ? pattern === url : pattern.test(url);
    });
  }
}
