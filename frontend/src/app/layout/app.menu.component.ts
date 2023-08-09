import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';
import { AuthService } from '../main/components/auth/auth.service';
import { IUser } from '../main/models/user.model';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];
    user!: IUser | null;

    constructor(public layoutService: LayoutService,
                private authService: AuthService) { }

    ngOnInit() {
        this.authService.getUser().subscribe(user => {
            this.user = user;
        

        this.model = [
            {
                label: `WELCOME ${this.user?.Name}`,
                items: [
                    { label: 'Home', icon: 'fa fa-home', routerLink: ['/'] },
                    { label: 'Setup', icon: 'fa fa-golf-ball-tee', routerLink: ['/setup'] },
                    { label: 'Notifications', icon: 'fa fa-bell', routerLink: ['/notifications'] },
                    { label: 'Courses', icon: 'fa fa-map-location-dot', routerLink: ['/courses'] },
                    { label: 'Live Search', icon: 'fa-brands fa-searchengin', routerLink: ['/search'] }
                ]
            },
            
        ];

        if (this.user?.Admin) {
            this.model.push({
                label: 'ADMIN',
                items: [
                    { label: 'Users', icon: 'fa fa-users', routerLink: ['/user'] },
                    { label: 'Timechecks', icon: 'fa fa-golf-ball-tee', routerLink: ['/timechecks'] },
                ]
            },)
        }

        });
    }
}
