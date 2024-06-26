import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Course, UserCourse } from '../../models/course.model';
import { CourseService } from '../../service/course.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: "app-courses",
  templateUrl: "./courses.component.html",
  styleUrls: ["./courses.component.scss"],
})
export class CoursesComponent implements OnInit {
  @Output() refreshModal = new EventEmitter<void>();

  isAdmin: boolean = false;
  courses: UserCourse[] = [];
  addCourseDialog: boolean = false;

  constructor(
    private courseService: CourseService,
    public layoutService: LayoutService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.getUserCourses();
    if (this.courses.length == 0) {
      this.addCourseDialog = true;
    }

    this.authService.getUser().pipe(filter(user => user !== null), distinctUntilChanged(), debounceTime(100)).subscribe(loggedInUser => {
      this.isAdmin = Boolean(loggedInUser.Admin);
    });
  }

  async getUserCourses() {
    this.courses = await firstValueFrom(
      this.courseService.getUserCourses({ all: true })
    );
    this.courses.map((x) => (x.Active = Boolean(x.Active)));
  }

  async updateCourseOrder() {
    await firstValueFrom(this.courseService.updateCourseOrder(this.courses));
  }

  async deleteUserCourse(courseId: number) {
    await firstValueFrom(this.courseService.removeUserCourse(courseId));
    this.refreshModal.emit();
    const i  = this.courses.findIndex(x => x.CourseId == courseId);
    this.courses.splice(i, 1);
    await this.updateCourseOrder();
  }

  addCourseToList(newCourse: UserCourse) {
    newCourse.Active = Boolean(newCourse.Active)
    this.courses.push(newCourse);
  }

  moveUp(index: number): void {
    if (index === 0) return; // If it's the first element, don't move it up
    const temp = this.courses[index];
    this.courses[index] = this.courses[index - 1];
    this.courses[index - 1] = temp;
    this.updateCourseOrder();
  }

  moveDown(index: number): void {
    if (index === this.courses.length - 1) return; // If it's the last element, don't move it down
    const temp = this.courses[index];
    this.courses[index] = this.courses[index + 1];
    this.courses[index + 1] = temp;
    this.updateCourseOrder();
  }
}
