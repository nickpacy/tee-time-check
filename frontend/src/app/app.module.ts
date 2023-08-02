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


@NgModule({
    declarations: [
        AppComponent, DashboardComponent, NotfoundComponent, UserComponent, TimechecksComponent, CoursesComponent,
        LocalTimePipe,
        BycourseComponent
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        CommonModule,
        PrimeNgModule
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        UserService, CourseService, DatePipe
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
