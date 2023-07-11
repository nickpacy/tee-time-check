import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { UserComponent } from './main/components/user/user.component';
import { TimechecksComponent } from './main/components/timechecks/timechecks.component';
import { CoursesComponent } from './main/components/courses/courses.component';
import { AuthGuard } from './main/components/auth/auth.service';
import { BycourseComponent } from './main/components/timechecks/bycourse/bycourse.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: '', component: AppLayoutComponent,
                children: [
                    { path: '', loadChildren: () => import('./demo/components/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard] },
                    { path: 'uikit', loadChildren: () => import('./demo/components/uikit/uikit.module').then(m => m.UIkitModule) },
                    { path: 'utilities', loadChildren: () => import('./demo/components/utilities/utilities.module').then(m => m.UtilitiesModule) },
                    { path: 'documentation', loadChildren: () => import('./demo/components/documentation/documentation.module').then(m => m.DocumentationModule) },
                    { path: 'blocks', loadChildren: () => import('./demo/components/primeblocks/primeblocks.module').then(m => m.PrimeBlocksModule) },
                    { path: 'pages', loadChildren: () => import('./demo/components/pages/pages.module').then(m => m.PagesModule) },
                    { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
                    { path: 'courses', component: CoursesComponent, canActivate: [AuthGuard] },
                    { path: 'timechecks', component: TimechecksComponent, canActivate: [AuthGuard] },
                    { path: 'timechecksbycourse/:userId', component: BycourseComponent, canActivate: [AuthGuard] },
                    { path: 'timechecks/:userId', component: TimechecksComponent, canActivate: [AuthGuard] },
                ]
            },
            { path: 'auth', loadChildren: () => import('./main/components/auth/auth.module').then(m => m.AuthModule) },
            { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },
            
            { path: 'notfound', component: NotfoundComponent, canActivate: [AuthGuard] },
            { path: '**', redirectTo: '/notfound' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
