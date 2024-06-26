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
import { NotificationsComponent } from './main/components/notifications/notifications.component';
import { SearchComponent } from './main/components/search/search.component';
import { CalendarComponent } from './main/components/calendar/calendar.component';
import { BydayComponent } from './main/components/timechecks/byday/byday.component';
import { MetricsComponent } from './main/components/metrics/metrics.component';
import { FriendsComponent } from './main/components/friends/friends.component';
import { TeesheetComponent } from './main/components/teesheet/teesheet.component';
import { AddCourseComponent } from './main/components/courses/add-course/add-course.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: '', component: AppLayoutComponent,
                children: [
                    { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
                    { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
                    { path: 'profile/:userId', component: ProfileComponent, canActivate: [AuthGuard] },
                    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
                    { path: 'courses', component: CoursesComponent, canActivate: [AuthGuard] },
                    { path: 'courses/:id', component: AddCourseComponent, canActivate: [AuthGuard] },
                    { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard] },
                    { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
                    { path: 'timechecks', component: TimechecksComponent, canActivate: [AuthGuard] },
                    { path: 'setup', component: BycourseComponent, canActivate: [AuthGuard] },
                    { path: 'setup/day', component: BydayComponent, canActivate: [AuthGuard] },
                    { path: 'search', component: SearchComponent, canActivate: [AuthGuard] },
                    { path: 'metrics', component: MetricsComponent, canActivate: [AuthGuard] },
                    // { path: 'friends', component: FriendsComponent, canActivate: [AuthGuard] },
                    // { path: 'teesheet', component: TeesheetComponent, canActivate: [AuthGuard] },

                ]
            },
            { path: 'auth', loadChildren: () => import('./main/components/auth/auth.module').then(m => m.AuthModule) },
            
            { path: 'notfound', component: NotfoundComponent, canActivate: [AuthGuard] },
            { path: '**', redirectTo: '/notfound' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
