import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { ProductService } from './demo/service/product.service';
import { CountryService } from './demo/service/country.service';
import { CustomerService } from './demo/service/customer.service';
import { EventService } from './demo/service/event.service';
import { IconService } from './demo/service/icon.service';
import { NodeService } from './demo/service/node.service';
import { PhotoService } from './demo/service/photo.service';
import { UserService } from './main/service/user.service';
import { UserComponent } from './main/components/user/user.component';
import { TimechecksComponent } from './main/components/timechecks/timechecks.component';
import { CoursesComponent } from './main/components/courses/courses.component';
import { CourseService } from './main/service/course.service';
import { PrimeNgModule } from './shared/primeng.module';
import { LocalTimePipe } from './shared/localTime.pipe';
import { BycourseComponent } from './main/components/timechecks/bycourse/bycourse.component';

@NgModule({
    declarations: [
        AppComponent, NotfoundComponent, UserComponent, TimechecksComponent, CoursesComponent,
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
        CountryService, CustomerService, EventService, IconService, NodeService,
        PhotoService, ProductService, UserService, CourseService, DatePipe
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
