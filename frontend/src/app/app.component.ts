import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { AuthService } from './main/components/auth/auth.service';
import { filter } from 'rxjs/operators';
import { LoadingService } from './main/service/loading.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    isLoading = false;

    constructor(private primengConfig: PrimeNGConfig,
                private loadingService: LoadingService,
                private cdr: ChangeDetectorRef, 
                private authService: AuthService) { }

    ngOnInit() {
        this.loadingService.isLoading$.subscribe(isLoading => {
            setTimeout(() => {
                this.isLoading = isLoading;
                this.cdr.detectChanges(); // Manually trigger change detection after modifying the property
              });
        });

        this.primengConfig.ripple = true;
        this.authService.loadUserFromToken();
        this.authService.getUser().pipe(
          filter(user => user !== null)  // filter out null values
        ).subscribe(user => {
            this.loadingService.hide();
        })
    }
}
