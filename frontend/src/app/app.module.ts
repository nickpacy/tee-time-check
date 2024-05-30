import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './main/components/notfound/notfound.component';
import { UserService } from './main/service/user.service';
import { UserComponent } from './main/components/user/user.component';
import { TimechecksComponent } from './main/components/timechecks/timechecks.component';
import { CoursesComponent } from './main/components/courses/courses.component';
import { CourseService } from './main/service/course.service';
import { PrimeNgModule } from './shared/primeng.module';
import { LocalTimePipe } from './shared/localTime.pipe';
import { BycourseComponent } from './main/components/timechecks/bycourse/bycourse.component';
import { DashboardComponent } from './main/components/dashboard/dashboard.component';
import { ProfileComponent } from './main/components/user/profile/profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChangePasswordFormComponent } from './main/components/user/change-password-form/change-password-form.component';
import { NotificationsComponent } from './main/components/notifications/notifications.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './shared/loading.interceptor';
import { SearchComponent } from './main/components/search/search.component';
import { CalendarComponent } from './main/components/calendar/calendar.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AuthInterceptor } from './shared/auth-interceptor.service';
import { UserSettingsComponent } from './main/components/user/user-settings/user-settings.component';
import { BydayComponent } from './main/components/timechecks/byday/byday.component';
import { UserByWeekComponent } from './main/components/metrics/notifications/user-by-week/user-by-week.component';
import { UserByCourseComponent } from './main/components/metrics/notifications/user-by-course/user-by-course.component';
import { MetricsComponent } from './main/components/metrics/metrics.component';
import { FriendsComponent } from './main/components/friends/friends.component';
import { ProperCasePipe } from './shared/proper-case.pipe';
import { TeesheetComponent } from './main/components/teesheet/teesheet.component';
import { TeeTimeDetailComponent } from './main/components/teesheet/tee-time-detail/tee-time-detail.component';
import { AddUserCoursesComponent } from './main/components/courses/add-user-courses/add-user-courses.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddCourseComponent } from './main/components/courses/add-course/add-course.component';


@NgModule({
    declarations: [
        AppComponent, DashboardComponent, NotfoundComponent, UserComponent, TimechecksComponent, CoursesComponent,
        LocalTimePipe, ProperCasePipe,
        BycourseComponent,
        ProfileComponent,
        ChangePasswordFormComponent,
        NotificationsComponent,
        SearchComponent,
        CalendarComponent,
        UserSettingsComponent,
        BydayComponent,
        UserByWeekComponent,
        UserByCourseComponent,
        MetricsComponent,
        FriendsComponent,
        TeesheetComponent,
        TeeTimeDetailComponent,
        AddUserCoursesComponent,
        AddCourseComponent
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        PrimeNgModule,
        FullCalendarModule
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        UserService, CourseService, DatePipe
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
