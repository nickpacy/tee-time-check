import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable, debounceTime, distinctUntilChanged, filter, firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { UserCourse } from 'src/app/main/models/course.model';
import { CourseService } from 'src/app/main/service/course.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-user-courses',
  templateUrl: './add-user-courses.component.html',
  styleUrls: ['./add-user-courses.component.scss'],
  animations: [
    trigger('shrinkOut', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      state('out', style({ opacity: 0, transform: 'scale(0)' })),
      transition('in => out', animate('300ms ease-in'))
    ])
  ]
})
export class AddUserCoursesComponent implements OnChanges {
  @Input() refreshTrigger: Observable<void>;
  @Output() onCourseAdded = new EventEmitter<UserCourse>();

  courses: UserCourse[] = [];
  addCourseDialog: boolean = true;
  shrinkState = 'in';
  showCheck = false;
  selectedMiles: number = 80467.2;
  milesList = [{
    meters: 40233.6,
    miles: '25 miles'
  },{
    meters: 80467.2,
    miles: '50 miles'
  },{
    meters: 160934,
    miles: '100 miles'
  },{
    meters: 402336,
    miles: '250 miles'
  },{
    meters: 10000000,
    miles: 'All'
  }];

  
  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    public layoutService: LayoutService
  ) {}

  ngOnInit() {
    this.getCoursesNearby();
    this.checkUserLocation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.refreshTrigger.subscribe(() => {
        this.getCoursesNearby();
      });
    }
  }

  checkUserLocation() {
    this.authService.getUser().pipe(filter(user => user !== null), distinctUntilChanged(), debounceTime(100)).subscribe(loggedInUser => {
      console.log(loggedInUser);
      if (!loggedInUser.Latitude || !loggedInUser.Longitude) {
        alert("No location found. Please fill in the location on the Profile screen.")
        this.router.navigate(['/profile']);
      }
    });
  }

  async getCoursesNearby() {

    this.courses = await firstValueFrom(
      this.courseService.getCoursesByDistance(this.selectedMiles)
    );
    this.courses.map((x) => (x.Active = Boolean(x.Active)));
    this.courses.map((x) => (x.UserCourseActive = Boolean(x.UserCourseActive)));
    this.courses.map((x) => (x.UserCourseEnabled = Boolean(x.UserCourseEnabled)));
    this.courses.map((x) => (x.Miles = x.Distance / 1609.34));
  }

  async toggleIcon(course: any) {
    course.Animating = true;
    const newCourse = await firstValueFrom(this.courseService.addUserCourse(course.CourseId));
    this.onCourseAdded.emit(newCourse);
    setTimeout(() => {
      course.UserCourseActive = true;
      course.UserCourseEnabled = true;
      course.Animating = false;
    }, 300); // Should match the duration of the animation
  }


}
