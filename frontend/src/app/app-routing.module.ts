import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './main/components/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { UserComponent } from './main/components/user/user.component';
import { TimechecksComponent } from './main/components/timechecks/timechecks.component';
import { CoursesComponent } from './main/components/courses/courses.component';
import { AuthGuard } from './main/components/auth/auth.service';
import { BycourseComponent } from './main/components/timechecks/bycourse/bycourse.component';
import { DashboardComponent } from './main/components/dashboard/dashboard.component';
import { ProfileComponent } from './main/components/user/profile/profile.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: '', component: AppLayoutComponent,
                children: [
                    { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
                    { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
                    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
                    { path: 'courses', component: CoursesComponent, canActivate: [AuthGuard] },
                    { path: 'timechecks', component: TimechecksComponent, canActivate: [AuthGuard] },
                    { path: 'timechecksbycourse', component: BycourseComponent, canActivate: [AuthGuard] },
                    { path: 'timechecks', component: TimechecksComponent, canActivate: [AuthGuard] },
                ]
            },
            { path: 'auth', loadChildren: () => import('./main/components/auth/auth.module').then(m => m.AuthModule) },
            { path: 'landing', loadChildren: () => import('./main/components/landing/landing.module').then(m => m.LandingModule) },
            
            { path: 'notfound', component: NotfoundComponent, canActivate: [AuthGuard] },
            { path: '**', redirectTo: '/notfound' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
