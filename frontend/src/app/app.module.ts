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


@NgModule({
    declarations: [
        AppComponent, DashboardComponent, NotfoundComponent, UserComponent, TimechecksComponent, CoursesComponent,
        LocalTimePipe,
        BycourseComponent,
        ProfileComponent,
        ChangePasswordFormComponent,
        NotificationsComponent,
        SearchComponent,
        CalendarComponent
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
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
