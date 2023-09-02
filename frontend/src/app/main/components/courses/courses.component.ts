import { Component, OnInit } from '@angular/core';
import { Course, UserCourse } from '../../models/course.model';
import { CourseService } from '../../service/course.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {

  courses: UserCourse[] = [];

  constructor(private courseService: CourseService) { }

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

}
