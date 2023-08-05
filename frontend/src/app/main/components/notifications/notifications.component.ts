import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../service/notification.service';
import { AuthService } from '../auth/auth.service';
import { UtilityService } from '../../service/utility.service';

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
  
  removeNotification(courseId, tDate, teeTime) {

    const n = {
      UserId: this.USERID,
      CourseId: courseId, 
      CheckDate: tDate,
      TeeTime: teeTime
    }

    console.log(n)
    this.notificationService.removeNotification(n)
    .subscribe(res => {
      this.notifications = this.notifications.map(course => {
        if (course.CourseId === courseId) {
          course.Dates = course.Dates.map(d => {
            if (d.Date === tDate) {
              d.TeeTimes = d.TeeTimes.filter(tt => tt !== teeTime);
            }
            return d;
          });
        }
        return course;
      });
      console.log("Notify removeed", res);
      
    }, (error: any) => {
      console.error(error);
    });
  }
}
