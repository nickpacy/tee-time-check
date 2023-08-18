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
  notifications: any[] = [];

  constructor(private notificationService: NotificationsService,
              private authService: AuthService,
              private datePipe: DatePipe,
              private utilService: UtilityService){}

  ngOnInit(): void {
    this.USERID = this.authService.getUserId();
    this.getNotifications();
  }

  getNotifications() {
    this.notifications = [];
    return new Promise((resolve, reject) => {
      this.notificationService.getNotificationsByCourse()
        .subscribe(res => {
          
          this.notifications = this.groupNotificationsByCourseAndDate(res);
          resolve(true)
        }, (error: any) => {
          console.error(error);
          reject(true);
        });

    });
  }


  groupNotificationsByCourseAndDate(notifications: any[]) {
    const grouped = [];

    notifications.forEach(notification => {
        // Convert the UTC time to local time
        const localTeeTime = new Date(notification.TeeTime).toLocaleDateString();

        let courseEntry = grouped.find(course => course.courseId === notification.CourseId);
        if (!courseEntry) {
            courseEntry = {
                courseName: notification.CourseName,
                courseId: notification.CourseId,
                imageUrl: notification.ImageUrl,
                dates: []
            };
            grouped.push(courseEntry);
        }

        let dateEntry = courseEntry.dates.find(d => d.date === localTeeTime);
        if (!dateEntry) {
            dateEntry = {
                date: localTeeTime,
                teeTimes: []
            };
            courseEntry.dates.push(dateEntry);
        }

        dateEntry.teeTimes.push({
            time: notification.TeeTime,
            notificationId: notification.NotificationId
        });
    });

    // Sort the courses by courseId
    grouped.sort((a, b) => a.courseId - b.courseId);

    // Sort the dates within each course
    grouped.forEach(course => {
        course.dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Sort the tee times within each date
        course.dates.forEach(dateEntry => {
            dateEntry.teeTimes.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        });
    });


    return grouped;
  }
  
  removeNotification(courseId, tDate, notificationId) {

    this.notificationService.removeNotification(notificationId)
    .subscribe(res => {
      this.notifications = this.notifications.map(course => {
        if (course.courseId === courseId) {
          course.dates = course.dates.map(d => {
            if (d.date === tDate) {
              d.teeTimes = d.teeTimes.filter(tt => tt.notificationId !== notificationId);
            }
            return d;
          });
        }
        return course;
      });
    }, (error: any) => {
      console.error(error);
    });

  }
}
