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
    darkMode: boolean = false;

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService,
                public authService: AuthService) { }
    
    ngOnInit() {
        this.darkMode = localStorage.getItem('ttcdm') == 'dark';
        if (this.darkMode) {
            this.setDarkMode(true);
        }
        this.authService.getUser().subscribe(user => {
              this.user = user;
          })
    }

    setDarkMode(mode) {
        this.darkMode = mode;
        if (this.darkMode) {
            this.changeTheme('lara-dark-teal', 'dark')
            localStorage.setItem('ttcdm', 'dark');
        } else {
            this.changeTheme('lara-light-teal', 'light')
            localStorage.setItem('ttcdm', 'light');
        }
    }

    changeTheme(theme: string, colorScheme: string) {
        const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
        const newHref = themeLink.getAttribute('href')!.replace(this.layoutService.config.theme, theme);
        this.layoutService.config.colorScheme
        this.replaceThemeLink(newHref, () => {
            this.layoutService.config.theme = theme;
            this.layoutService.config.colorScheme = colorScheme;
            this.layoutService.onConfigUpdate();
        });
    }

    replaceThemeLink(href: string, onComplete: Function) {
        const id = 'theme-css';
        const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
        const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);

        cloneLinkElement.setAttribute('href', href);
        cloneLinkElement.setAttribute('id', id + '-clone');

        themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);

        cloneLinkElement.addEventListener('load', () => {
            themeLink.remove();
            cloneLinkElement.setAttribute('id', id);
            onComplete();
        });
    }
    
}
