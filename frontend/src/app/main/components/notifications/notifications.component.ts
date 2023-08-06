import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../service/notification.service';
import { AuthService } from '../auth/auth.service';
import { UtilityService } from '../../service/utility.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit{

  USERID!: number;
  notifications!: any;

  constructor(private notificationService: NotificationsService,
              private authService: AuthService,
              private datePipe: DatePipe,
              private utilService: UtilityService){}

  ngOnInit(): void {
    this.USERID = this.authService.getUserId();
    this.notificationService.getNotificationsByCourse(this.USERID)
    .subscribe(res => {
      this.notifications = res;
      console.log("Courses", res);
      
    }, (error: any) => {
      console.error(error);
    });
  }

  transformDate(date: string): string {
    return this.datePipe.transform(date, 'fullDate', '-700');
  }
  
  transformTime(time: string): string {
    return this.datePipe.transform(time, 'hh:mm a', '-700');
  }
  
  removeNotification(courseId, tDate, notifiedTeeTimeId) {

    this.notificationService.removeNotification(notifiedTeeTimeId)
    .subscribe(res => {
      this.notifications = this.notifications.map(course => {
        if (course.CourseId === courseId) {
          course.Dates = course.Dates.map(d => {
            if (d.Date === tDate) {
              d.TeeTimes = d.TeeTimes.filter(tt => tt.notifiedTeeTimeId !== notifiedTeeTimeId);
            }
            return d;
          });
        }
        return course;
      });
      console.log("Notify removed", res);
    }, (error: any) => {
      console.error(error);
    });

  }
}
