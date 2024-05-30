import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../service/notification.service';
import { AuthService } from '../auth/auth.service';
import { UtilityService } from '../../service/utility.service';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MetricService } from '../../service/metric.service';

@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
})
export class NotificationsComponent implements OnInit {
  USERID!: number;
  notifications: any[] = [];
  monthlyCharges: any[] = [];
  logoUrl: string = environment.logoUrl;

  constructor(
    private notificationService: NotificationsService,
    private authService: AuthService,
    private metricService: MetricService,
    private datePipe: DatePipe,
    private utilService: UtilityService
  ) {}

  ngOnInit(): void {
    this.USERID = this.authService.getUserId();
    this.getNotifications();
    this.getMonthlyCharges();
  }

  async getMonthlyCharges() {
    this.monthlyCharges = await firstValueFrom(this.metricService.getMonthlyCharges());
  }
  getTotalMessages() {
    return this.monthlyCharges.reduce((sum, charge) => sum + charge.totalMessages, 0);
  }

  getTotalCharges() {
    return this.monthlyCharges.reduce((sum, charge) => sum + parseFloat(charge.totalCharges), 0).toFixed(5);
  }

  async getNotifications() {
    const data = await firstValueFrom(
      this.notificationService.getNotificationsByCourse()
    );
    this.notifications = this.groupNotificationsByCourseAndDate(data);
  }

  async removeNotification(courseId, tDate, notificationId) {
    const data = await firstValueFrom(
      this.notificationService.removeNotification(notificationId)
    );
    this.notifications = this.notifications.map((course) => {
      if (course.courseId === courseId) {
        course.dates = course.dates.map((d) => {
          if (d.date === tDate) {
            d.teeTimes = d.teeTimes.filter(
              (tt) => tt.notificationId !== notificationId
            );
          }
          return d;
        });
      }
      return course;
    });
  }

  groupNotificationsByCourseAndDate(notifications: any[]) {
    const grouped = [];

    notifications.forEach((notification) => {
      // Convert the UTC time to local time
      const localTeeTime = new Date(notification.TeeTime).toLocaleDateString();

      let courseEntry = grouped.find(
        (course) => course.courseId === notification.CourseId
      );
      if (!courseEntry) {
        courseEntry = {
          courseName: notification.CourseName,
          courseId: notification.CourseId,
          imageUrl: notification.ImageUrl,
          dates: [],
        };
        grouped.push(courseEntry);
      }

      let dateEntry = courseEntry.dates.find((d) => d.date === localTeeTime);
      if (!dateEntry) {
        dateEntry = {
          date: localTeeTime,
          teeTimes: [],
        };
        courseEntry.dates.push(dateEntry);
      }

      dateEntry.teeTimes.push({
        time: notification.TeeTime,
        notificationId: notification.NotificationId,
      });
    });

    // Sort the courses by courseId
    grouped.sort((a, b) => a.courseId - b.courseId);

    // Sort the dates within each course
    grouped.forEach((course) => {
      course.dates.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Sort the tee times within each date
      course.dates.forEach((dateEntry) => {
        dateEntry.teeTimes.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
      });
    });

    return grouped;
  }
}
