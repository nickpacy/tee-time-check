import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullTimeCheck, Timecheck, TimecheckEntry } from '../../models/timecheck.model';
import { TimecheckService } from '../../service/timecheck.service';
import { UserService } from '../../service/user.service';
import { Message, MessageService } from 'primeng/api';
import { CourseService } from '../../service/course.service';
import { Course } from '../../models/course.model';
import { UtilityService } from '../../service/utility.service';
import { AuthService } from '../auth/auth.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Injectable()
@Component({
  selector: 'app-timechecks',
  templateUrl: './timechecks.component.html',
  styleUrls: ['./timechecks.component.scss']
})
export class TimechecksComponent implements OnInit {

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


  userTimechecks: any[];

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
              public layoutService: LayoutService,
              private messageService: MessageService,
              private userService: UserService,
              private courseService: CourseService,
              private timecheckService: TimecheckService) {}

  ngOnInit(): void {
    // this.USERID = this.authService.getUserId();
    // if (this.USERID == 0) {
    //   //No User:
    //   this.loading = false;
    //   this.emailDialog = true;
    // } else {
    //   this.getTimechecksByUser().finally(() => {
    //     this.getCourses();
    //     this.loading = false;
    //   });
    // }
    this.getAllUsersActiveTimechecks();
    // // console.log("HGel")
  }

  getTimechecksByUser() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByUserId(this.USERID).subscribe(
        (data: any[]) => {
          this.timechecks = data;
          // console.log(data);
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

  

  

  onSubmit() {
    if (!this.userEmail) {
      this.messageService.add({severity:'error', summary:'Service Message', detail:'Need an email'})
      return false;
    }
    return new Promise((resolve, reject) => {
      this.userService.getUserByEmail(this.userEmail).subscribe(
        (data: any) => {
          // console.log(data);
          this.router.navigate([`timechecks/${data.UserId}`]);
          resolve(true);
        },
        (error) => {
          this.messageService.add({severity:'error', summary:'Service Message', detail:'No user found'})
          console.error('Error getting user:', error);
          reject(true);
        }
      );
    });
  }

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
      
      // console.log(this.timecheck);
      this.submitted = true;
  
      this.timecheck.UserId = this.USERID;
      this.timecheck.StartTime = this.utilityService.utcTime(this.timecheck.StartDate)
      this.timecheck.EndTime = this.utilityService.utcTime(this.timecheck.EndDate)
  
      update = this.timecheck;
      this.loadingDialog = true;
      // console.log("NOT PASSED IN");
    } else {
      update = timecheck;
      // console.log("PASSED IN");
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
            // console.log(data);
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

  getCourses() {
    return new Promise((resolve, reject) => {
      this.courseService.getAllCourses().subscribe(
        (data: any) => {
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

  convertToTime(interval: number): string {
    const hours = Math.floor(interval / 4);
    const minutes = (interval % 4) * 15;
  
    const formattedHours = (hours === 0 || hours === 12) ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const period = (hours < 12) ? 'AM' : 'PM';
  
    return `${formattedHours}:${formattedMinutes} ${period}`;
  }

  
  getAllUsersActiveTimechecks() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getAllUsersActiveTimechecks()
        .subscribe(result => {
          this.userTimechecks = result;
          // console.log(result);
        }, error => {
          // console.log("getAllUsersActiveTimechecks", error);
        });
    });
  }

}
