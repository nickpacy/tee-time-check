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
  selector: 'app-bycourse',
  templateUrl: './bycourse.component.html',
  styleUrls: ['./bycourse.component.scss']
})
export class BycourseComponent {

  loading: boolean = true;
  USERID: number = 0;
  timechecks: FullTimeCheck[] = [];
  emailDialog: boolean = false;
  userEmail: string = '';
  timecheck: TimecheckEntry = new TimecheckEntry();
  submitted: boolean = false;
  timecheckDialog: boolean = false;
  loadingDialog: boolean = false;

  timeRange: number[] = [20, 65];

  selectedCourse: Course = new Course;

  courses: Course[] = [];
  daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
  ]

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
    this.USERID = this.authService.getUserId();
    console.log(this.USERID);

    if (this.USERID == 0) {
      //No User:
      this.loading = false;
      this.emailDialog = true;
    } else {
      this.getTimechecksByCourse().finally(() => {
        this.loading = false;
      })
    }

  }

  getTimechecksByUser() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByUserId(this.USERID).subscribe(
        (data: any[]) => {
          this.timechecks = data;
          console.log(data);
          this.timechecks.map((x) => {
            x.DayName = this.utilityService.dayName(x.DayOfWeek);
            x.Active = Boolean(x.Active);
          });
          resolve(true);
        },
        (error) => {
          console.error('Error getting Timechecks:', error);
          reject(true);
        }
      );
    })
  }  

  // onSubmit() {
  //   if (!this.userEmail) {
  //     this.messageService.add({severity:'error', summary:'Service Message', detail:'Need an email'})
  //     return false;
  //   }
  //   return new Promise((resolve, reject) => {
  //     this.userService.getUserByEmail(this.userEmail).subscribe(
  //       (data: any) => {
  //         console.log(data);
  //         this.router.navigate([`timechecks/${data.UserId}`]);
  //         resolve(true);
  //       },
  //       (error) => {
  //         this.messageService.add({severity:'error', summary:'Service Message', detail:'No user found'})
  //         console.error('Error getting user:', error);
  //         reject(true);
  //       }
  //     );
  //   });
  // }

  onNew() {
    this.timecheck = new TimecheckEntry();
    this.submitted = false;
    this.timecheckDialog = true;
  }

  onEdit(timecheck: TimecheckEntry) {
    this.timecheck = timecheck;
    this.timecheck.StartDate = this.utilityService.localTime(timecheck.StartTime);
    this.timecheck.EndDate = this.utilityService.localTime(timecheck.EndTime);

    this.submitted = false;
    this.timecheckDialog = true;

  }

  onSave(timecheck?: Timecheck) {
    
    let update = new Timecheck();
    if (!timecheck) {
      
      console.log(this.timecheck);
      this.submitted = true;
  
      this.timecheck.UserId = this.USERID;
      this.timecheck.StartTime = this.utilityService.utcTime(this.timecheck.StartDate)
      this.timecheck.EndTime = this.utilityService.utcTime(this.timecheck.EndDate)
  
      update = this.timecheck;
      this.loadingDialog = true;
      console.log("NOT PASSED IN");
    } else {
      update = timecheck;
      console.log("PASSED IN");
    }
    
    return new Promise((resolve, reject) => {

      if (update.Id) {
        //Edit Timecheck
        this.timecheckService.updateTimecheck(update.Id, update).subscribe(
          (data: any) => {
            this.timecheckDialog = false;
            this.getTimechecksByUser().finally(() => {
              this.loadingDialog = false;
            });
            resolve(true);
          },
          (error) => {
            console.error('Error updating timecheck:', error);
            this.loadingDialog = false;
            reject(true);
          }
        );
      } else {
        //Create New

        this.timecheckService.createTimecheck(update).subscribe(
          (data: any) => {
            this.timecheckDialog = false;
            this.getTimechecksByUser().finally(() => {
              this.loadingDialog = false;
            });
            resolve(true);
          },
          (error) => {
            console.error('Error creating timecheck:', error);
            this.loadingDialog = false;
            reject(true);
          }
        );
      }

      
    });
  }

  onDelete(timecheck: TimecheckEntry) {

    const id = timecheck.Id;
    
    this.loadingDialog = true;
    return new Promise((resolve, reject) => {
      if (id) {
        this.timecheckService.deleteTimecheck(id).subscribe(
          (data: any) => {
            console.log(data);
            this.getTimechecksByUser().finally(() => {
              this.loadingDialog = false;
            });
            resolve(true);
          },
          (error) => {
            this.loadingDialog = false;
            console.error('Error getting user:', error);
            reject(true);
          }
        );
      } else {
        resolve(true);
      }
      
    });
  }

  getTimechecksByCourse() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByCourse(this.USERID).subscribe(
        (data: any) => {
          console.log(data)
          this.courses = data;
          resolve(true);
        },
        (error) => {
          console.error('Error getting user:', error);
          reject(true);
        }
      );
    });
  }

  toggleActive(timecheck: Timecheck) {
    this.onSave(timecheck);
  }


  onCourseClick(course: Course) {
    this.selectedCourse = course;
    this.getTimechecks(course.CourseId).then(() => {
      this.timecheckDialog = true;
    });
  }

  getTimechecks(courseId: number) {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByUserIdAndCourseId(this.USERID, courseId).subscribe(
        (data: any[]) => {
          this.timechecks = data;
          console.log(data);
          this.timechecks.map((x) => {
            x.DayName = this.utilityService.dayName(x.DayOfWeek);
            x.Active = Boolean(x.Active);
            x.TimeInterval = this.utilityService.convertTimeToInterval(x.StartTime, x.EndTime);
          });
          resolve(true);
        },
        (error) => {
          console.error('Error getting Timechecks:', error);
          reject(true);
        }
      );
    })
  }


  onBulkSaveTimechecks() {
    if (this.timechecks.length > 0) {
      this.loadingDialog = true;
      
      this.timechecks.map((x: FullTimeCheck) => {
        x.StartTime = this.utilityService.convertIntervalToUTCTimeString(x.TimeInterval[0]);
        x.EndTime = this.utilityService.convertIntervalToUTCTimeString(x.TimeInterval[1]);
      });

      this.timecheckService.bulkUpdateTimechecks(this.timechecks).subscribe(
        (data: any) => {
          let courseId = this.timechecks[0].CourseId;
    
          // find the index of the course with the given courseId
          let courseIndex = this.courses.findIndex(course => course.CourseId === courseId);

          // check if a course was found
          if (courseIndex !== -1) {
            // update the timechecks for the course
            this.courses[courseIndex].Timechecks = this.timechecks.sort((a, b) => a.DayOfWeek - b.DayOfWeek);
          }

          this.timecheckDialog = false;
          this.loadingDialog = false;
        },
        (error) => {
          console.error('Error creating timecheck:', error);
          this.loadingDialog = false;
        }
      );

    }
  }

  hasActiveTimechecks(timechecks: any[]): boolean {
    return timechecks && timechecks.some(x => x.Active);
  }

  numActiveTimechecks(timechecks: any[]): number {
    return timechecks.filter(x => x.Active).length;
  }
  

}
