import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullTimeCheck, Timecheck, TimecheckEntry } from '../../../models/timecheck.model';
import { TimecheckService } from '../../../service/timecheck.service';
import { UserService } from '../../../service/user.service';
import { Message, MessageService } from 'primeng/api';
import { CourseService } from '../../../service/course.service';
import { Course } from '../../../models/course.model';
import { UtilityService } from '../../../service/utility.service';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
  selector: 'app-byday',
  templateUrl: './byday.component.html',
  styleUrls: ['./byday.component.scss']
})
export class BydayComponent implements OnInit {
  daysOfWeek = [
    { id: 0, name: 'Sunday', shortName: 'Sun', shorterName: 'Su' },
    { id: 1, name: 'Monday', shortName: 'Mon', shorterName: 'Mo' },
    { id: 2, name: 'Tuesday', shortName: 'Tue', shorterName: 'Tu' },
    { id: 3, name: 'Wednesday', shortName: 'Wed', shorterName: 'We' },
    { id: 4, name: 'Thursday', shortName: 'Thu', shorterName: 'Th' },
    { id: 5, name: 'Friday', shortName: 'Fri', shorterName: 'Fr' },
    { id: 6, name: 'Saturday', shortName: 'Sat', shorterName: 'Sa' }
  ];
  dayOfWeek: number = 0;
  timechecks: any[] = [];
  activeDayTimechecks: any[];
  courses: Course[]; // Add your course names here
  selectedCourses: number[];
  numberOfPlayers: number = 1;
  timeRange: number[] = [30, 65];
  playerOptions: number[] = [1, 2, 3, 4];
  searchTimeInterval: number[] = [35, 50];
  maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 15));
  minDate: Date = new Date();
  startTime: string;
  endTime: string;
  helpDialog: boolean = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private authService: AuthService,
              public utilityService: UtilityService,
              private messageService: MessageService,
              private userService: UserService,
              private courseService: CourseService,
              public layoutService: LayoutService,
              private timecheckService: TimecheckService) {}

  ngOnInit(): void {

    this.getAllCourses();
    this.getTimechecksByDay().then(() => {
      this.setActiveDay(this.dayOfWeek);
    });
  }

  getTimechecksByDay() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByDay().subscribe(
        (data: any) => {
          console.log(data);
          this.timechecks = data;
          resolve(true);
        },
        (error) => {
          console.error('Error getting user:', error);
          reject(true);
        }
      );
    });
  }

  getAllCourses() {
    return new Promise((resolve, reject) => {
      this.courseService.getUserCourses().subscribe(
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

  setActiveDay(dayOfWeek) {
    var i = this.timechecks.findIndex(x => x.id == dayOfWeek);
    this.activeDayTimechecks = this.timechecks[i].Timechecks;
    this.activeDayTimechecks.map(x => {
      x.Active = Boolean(x.Active);
    });
    this.selectedCourses = this.activeDayTimechecks.filter(x => Boolean(x.Active)).map(x => x.CourseId);
    console.log(this.selectedCourses);
  }

  updateCourseActive(e) {
    console.log(e);
    var activeCourses = e.value;

    // Iterate over each timecheck in the activeTimechecks array
    this.activeDayTimechecks.forEach(timecheck => {
        // If the timecheck's courseId is found in the activeCourses array, set Active to true
        if (activeCourses.includes(timecheck.CourseId)) {
            timecheck.Active = true;
        } else {
            // Optional: If you want to set the other timechecks to false when their courseId is NOT in activeCourses
            timecheck.Active = false;
        }
    });
  }

  onSave() {
    // console.log(this.activeDayTimechecks);
    this.activeDayTimechecks.map(x => {
      x.StartTime = this.utilityService.convertIntervalToUTCTimeString(this.searchTimeInterval[0]);
      x.EndTime = this.utilityService.convertIntervalToUTCTimeString(this.searchTimeInterval[1]);
      x.NumPlayers = this.numberOfPlayers;
    });

    // console.log(this.activeDayTimechecks);

    this.timecheckService.bulkUpdateTimechecks(this.activeDayTimechecks).subscribe(
      (data: any) => {
        this.messageService.add({severity:'success', summary:'Timechecks Saved', detail:'Changes saved successfully!'})
        var i = this.timechecks.findIndex(x => x.id == this.dayOfWeek);
        this.timechecks[i].Timechecks = this.activeDayTimechecks;
      },
      (error) => {
        console.error('Error creating timecheck:', error);
      }
    );

  }

}
