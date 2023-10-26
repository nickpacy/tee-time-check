import { Component, OnInit } from '@angular/core';
import { Course, UserCourse } from '../../models/course.model';
import { CourseService } from '../../service/course.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {

  courses: UserCourse[] = [];

  constructor(private courseService: CourseService,
              public layoutService: LayoutService) { }

  ngOnInit() {
    this.courseService.getUserCourses({all: true}).subscribe(
      (data: UserCourse[]) => {
        this.courses = data;
        this.courses.map(x => x.Active = Boolean(x.Active))
        // console.log('Courses:', this.courses);
      },
      (error) => {
        console.error('Error getting courses:', error);
      }
    );
  }

  updateCourseOrder() {
    this.courseService.updateCourseOrder(this.courses).subscribe(
      (data: any) => {
        
      },
      (error) => {
        console.error('Error getting courses:', error);
      }
    );
  }

  moveUp(index: number): void {
    if (index === 0) return;  // If it's the first element, don't move it up
    const temp = this.courses[index];
    this.courses[index] = this.courses[index - 1];
    this.courses[index - 1] = temp;
    this.updateCourseOrder();
  }
  
  moveDown(index: number): void {
    if (index === this.courses.length - 1) return;  // If it's the last element, don't move it down
    const temp = this.courses[index];
    this.courses[index] = this.courses[index + 1];
    this.courses[index + 1] = temp;
    this.updateCourseOrder();
  }

}
