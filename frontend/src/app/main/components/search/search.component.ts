import { Component, OnInit } from '@angular/core';
import { UtilityService } from '../../service/utility.service';
import { CourseService } from '../../service/course.service';
import { TeeTimeService } from '../../service/teetime.service';
import { Course } from '../../models/course.model';
import { DatePipe } from '@angular/common';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  searchDate: Date = new Date();
  searchTimeInterval: number[] = [35, 50];
  maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 15));
  minDate: Date = new Date();
  startTime: string;
  endTime: string;
  numberOfPlayers: number = 1;
  courses: Course[]; // Add your course names here
  selectedCourses: number[] = [1,2];
  timeRange: number[] = [30, 65];
  teeTimes: any[];
  hasSearched: boolean = false;

  playerOptions: number[] = [1, 2, 3, 4];

  constructor(public utilityService: UtilityService,
              private courseService: CourseService,
              private teeTimeService: TeeTimeService,
              private layoutService: LayoutService,
              private datePipe: DatePipe) {}

  ngOnInit(): void {
      if (this.layoutService.isOverlay()) this.layoutService.onMenuToggle();
      this.getAllCourses();
  }

  getAllCourses() {
    return new Promise((resolve, reject) => {
      this.courseService.getAllCourses().subscribe(
        (data: any[]) => {
          this.courses = data.filter(x => Boolean(x.Active));
          // console.log('Courses:', this.courses);
          resolve(true);
        },
        (error) => {
          console.error('Error getting courses:', error);
          reject(true);
        }
      );
    });
  }


  search() {

    const searchData = {
      courseIds: this.selectedCourses,
      date: this.datePipe.transform(this.searchDate, 'YYYY-MM-dd'),
      startTime: this.utilityService.convertIntervalToLocalTimeString(this.searchTimeInterval[0]),
      endTime: this.utilityService.convertIntervalToLocalTimeString(this.searchTimeInterval[1]),
      numPlayers: this.numberOfPlayers
    }

    // console.log(searchData);

    return new Promise((resolve, reject) => {
      this.teeTimeService.globalSearch(searchData).subscribe(
        (data: any[]) => {
          this.teeTimes = data.sort((a, b) => {
            return new Date(a.time).getTime() - new Date(b.time).getTime();
          });
          this.hasSearched = true;
          // console.log('Search Data:', this.teeTimes);
          resolve(true);
        },
        (error) => {
          console.error('Error on search:', error);
          reject(true);
        }
      );
    });

  }

  openBookingLink(bookingUrl) {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank');
    }
  }

}
