import { Component, OnInit } from '@angular/core';
import { Course } from '../../models/course.model';
import { CourseService } from '../../service/course.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {

  courses: Course[] = [];

  constructor(private courseService: CourseService) { }

  ngOnInit() {
    this.courseService.getAllCourses().subscribe(
      (data: any[]) => {
        this.courses = data;
        // console.log('Courses:', this.courses);
      },
      (error) => {
        console.error('Error getting courses:', error);
      }
    );
  }
}
