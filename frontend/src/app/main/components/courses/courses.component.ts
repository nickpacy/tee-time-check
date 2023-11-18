import { Component, OnInit } from '@angular/core';
import { Course, UserCourse } from '../../models/course.model';
import { CourseService } from '../../service/course.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: "app-courses",
  templateUrl: "./courses.component.html",
  styleUrls: ["./courses.component.scss"],
})
export class CoursesComponent implements OnInit {
  courses: UserCourse[] = [];

  constructor(
    private courseService: CourseService,
    public layoutService: LayoutService
  ) {}

  ngOnInit() {
    this.getUserCourses();
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
