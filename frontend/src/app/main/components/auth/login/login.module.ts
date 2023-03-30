import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { PrimeNgModule } from 'src/app/shared/primeng.module';

@NgModule({
    imports: [
        CommonModule,
        LoginRoutingModule,
        PrimeNgModule
    ],
    declarations: [LoginComponent]
})
export class LoginModule { }
