import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models/course.model';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  getCourseById(courseId: number): Observable<Course> {
    const url = `${this.apiUrl}/${courseId}`;
    return this.http.get<Course>(url);
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(courseId: number, course: Course): Observable<Course> {
    const url = `${this.apiUrl}/${courseId}`;
    return this.http.put<Course>(url, course);
  }

  deleteCourse(courseId: number): Observable<any> {
    const url = `${this.apiUrl}/${courseId}`;
    return this.http.delete(url);
  }
}