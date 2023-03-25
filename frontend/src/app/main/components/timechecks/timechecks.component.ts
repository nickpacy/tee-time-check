import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullTimeCheck, Timecheck, TimecheckEntry } from '../../api/timechecks.interface';
import { TimecheckService } from '../../service/timecheck.service';
import { UserService } from '../../service/user.service';
import { Message, MessageService } from 'primeng/api';
import { CourseService } from '../../service/course.service';
import { Course } from '../../api/courses.interface';
import { UtilityService } from '../../service/utility.service';

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
              private utilityService: UtilityService,
              private messageService: MessageService,
              private userService: UserService,
              private courseService: CourseService,
              private timecheckService: TimecheckService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.USERID = Number(params.get('userId'));
      if (this.USERID == 0) {
        //No User:
        this.loading = false;
        this.emailDialog = true;
      } else {
        this.getTimechecksByUser().finally(() => {
          this.getCourses();
          this.loading = false;
        });
      }
      
      
      
    });
  }

  getTimechecksByUser() {
    return new Promise((resolve, reject) => {
      this.timecheckService.getTimechecksByUserId(this.USERID).subscribe(
        (data: any[]) => {
          this.timechecks = data;
          this.timechecks.map((x) => {
            x.DayName = this.utilityService.dayName(x.DayOfWeek);
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
          console.log(data);
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

  onSave() {
    console.log(this.timecheck);
    this.submitted = true;

    this.timecheck.UserId = this.USERID;
    this.timecheck.StartTime = this.utilityService.utcTime(this.timecheck.StartDate)
    this.timecheck.EndTime = this.utilityService.utcTime(this.timecheck.EndDate)

    this.loadingDialog = true;
    return new Promise((resolve, reject) => {

      if (this.timecheck.Id) {
        //Edit Timecheck
        this.timecheckService.updateTimecheck(this.timecheck.Id, this.timecheck).subscribe(
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
      } else {
        //Create New

        this.timecheckService.createTimecheck(this.timecheck).subscribe(
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

}
