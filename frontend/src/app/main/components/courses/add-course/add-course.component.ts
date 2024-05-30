import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom } from 'rxjs';
import { Course } from 'src/app/main/models/course.model';
import { CourseService } from 'src/app/main/service/course.service';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.scss']
})
export class AddCourseComponent implements OnInit {

  COURSEID: number = 0;
  course: Course;
  isAdmin: boolean = false;
  showWebsiteId: boolean = false;
  showBookingPrefix: boolean = false;
  showScheduleId: boolean = false;

  methods: any[] = [{label: 'ForeUp', value: 'foreup'}, {label: 'Tee It Up', value: 'teeitup'}, {label: 'Chrono Golf', value: 'chrono'}, {label: 'Golf Now/EZLinks', value: 'golfnow'}]
  timezones: string[] = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles'];

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private router: Router,
    // public layoutService: LayoutService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.COURSEID = this.route.snapshot.params['id'];

    this.authService.getUser().pipe(filter(user => user !== null), distinctUntilChanged(), debounceTime(100)).subscribe(loggedInUser => {
      this.isAdmin = Boolean(loggedInUser.Admin);
      if (!this.isAdmin) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You are not authorized to access this page.' });
        this.router.navigate(['/']);
      }
    });
    if (this.COURSEID > 0) {
     await this.getCourseById(this.COURSEID);     
    } else {
      this.course = new Course();
      this.course.Method = 'foreup';
    }
    this.updateFieldsBasedOnMethod();
  }


  async getCourseById(id: number) {
    this.course = await firstValueFrom(this.courseService.getCourseById(id));
  }

  onMethodChange(event: any) {
    this.updateFieldsBasedOnMethod();
  }

  updateFieldsBasedOnMethod() {
    if (this.course.Method === 'foreup') {
      this.showWebsiteId = false;
      this.showBookingPrefix = false;
      this.showScheduleId = true;
    } else if (this.course.Method === 'teeitup') {
      this.showWebsiteId = false;
      this.showBookingPrefix = true;
      this.showScheduleId = false;
    } else if (this.course.Method === 'chrono') {
      this.showWebsiteId = true;
      this.showBookingPrefix = false;
      this.showScheduleId = true;
    } else if (this.course.Method === 'golfnow') {
      this.showWebsiteId = false;
      this.showBookingPrefix = false;
      this.showScheduleId = false;
    }
  }

  async onSave() {

    if (!this.isFormValid()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields.' });
      return;
    }

    if (this.course.ScheduleId === undefined || !this.course.ScheduleId) {
      this.course.ScheduleId = 0;
    }

    if (this.COURSEID == 0) {
      this.course = await firstValueFrom(this.courseService.createCourse(this.course));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Course created successfully.' });
      this.router.navigate(['/courses', this.course.CourseId]);
    } else {
      await firstValueFrom(this.courseService.updateCourse(this.COURSEID, this.course));
      console.log(this.course);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Course updated successfully.' });
    }
  }

  isFormValid(): boolean {
    if (
      !this.course.CourseName ||
      !this.course.CourseAbbr ||
      this.course.BookingClass === undefined ||
      !this.course.Method ||
      this.course.Latitude === undefined ||
      this.course.Longitude === undefined
    ) {
      return false;
    }
  
    // Validate additional fields based on the Method
    if (this.course.Method === 'foreup') {
      if (this.course.ScheduleId === undefined) {
        return false;
      }
    } else if (this.course.Method === 'teeitup') {
      if (!this.course.BookingPrefix) {
        return false;
      }
    } else if (this.course.Method === 'chrono') {
      if (
        !this.course.WebsiteId ||
        this.course.ScheduleId === undefined
      ) {
        return false;
      }
    } else if (this.course.Method === 'golfnow') {
      // No additional checks needed for golfnow
    }
  
    return true;
  }

}
