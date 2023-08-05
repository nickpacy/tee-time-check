import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/main/components/auth/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class LoginComponent {

    valCheck: string[] = ['remember'];

    email!: string;
    password!: string;
    remember: boolean = false;
    forgotDialog: boolean = false;
    submitted: boolean = false;

    constructor(public layoutService: LayoutService,
                private router: Router,
                private authService: AuthService,
                private messageService: MessageService) { }

    login() {
        if (!this.password || !this.email) {
            return false;
        }

        let user = {Email: this.email, Password: this.password, Remember: this.remember};
        return new Promise((resolve, reject) => {
            this.authService.login(user)
                .subscribe(result => {
                    console.log("Login Result", result);
                    this.router.navigate(['/']);
                    resolve(true);
                }, error => {
                    console.error("Login Error", error);
                    this.messageService.clear();
                    this.messageService.add({severity:'error', summary:'Login Error', detail: error.error.message, life: 3000});
                    reject(true);
                })
        });

    }

    forgotPassword() {
        this.submitted = true;
        if (this.email) {
            let user = {Email: this.email};
            this.authService.forgotPassword(user)
                .subscribe(result => {
                    console.log("Login Result", result);
                    this.messageService.add({severity:'success', summary:'Email Sent', detail: `Email sent to ${this.email}`, life: 2000});
                    this.forgotDialog = false;
                }, error => {
                    console.error("Login Error", error);
                    this.messageService.add({severity:'error', summary:'Error', detail: error.error.message, life: 2000});
                    this.forgotDialog = false;
                })
        }

    }
}
