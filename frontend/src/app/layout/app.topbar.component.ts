import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { AuthService } from '../main/components/auth/auth.service';
import { IUser } from '../main/models/user.model';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent implements OnInit {
    user: IUser | null = null
    items!: MenuItem[];

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService,
                public authService: AuthService) { }
    
    ngOnInit() {
        this.authService.getUser().subscribe(user => {
              this.user = user;
          })
    }
}
