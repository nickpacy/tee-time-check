import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { AuthService } from './main/components/auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    isLoading: boolean = true;

    constructor(private primengConfig: PrimeNGConfig,
                private authService: AuthService) { }

    ngOnInit() {
        this.primengConfig.ripple = true;
        this.authService.loadUserFromToken();
        this.authService.getUser().pipe(
          filter(user => user !== null)  // filter out null values
        ).subscribe(user => {
            console.log("appCom", user)
            this.isLoading = false;
        })
    }
}
