import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../service/notification.service';
import { AuthService } from '../auth/auth.service';
import { UtilityService } from '../../service/utility.service';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MetricService } from '../../service/metric.service';
import { CommunicationsService } from '../../service/communications.service';
import { CommsSummary, Communication, ListParams } from '../../models/communication.model';

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

  metrics: CommsSummary | null = null;
  smsRemaining = 5;

  constructor(
    private notificationService: NotificationsService,
    private authService: AuthService,
    private metricService: MetricService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private utilService: UtilityService,
    private comms: CommunicationsService
  ) {}

  ngOnInit(): void {
    this.USERID = this.authService.getUserId();
    this.getNotifications();
    this.getMonthlyCharges();
    this.loadMetrics(); // totals per channel/status in last 24h
    this.computeSmsRemaining(); // from API, per user
  }

    // ---------- metrics ----------
  private loadMetrics(): void {
    this.comms.summaryMe(48).subscribe({
      next: (res) => (this.metrics = res),
      error: () => (this.metrics = null),
    });
  }

  private computeSmsRemaining(): void {
    this.comms.smsCountTodayMe().subscribe({
      next: (r) => (this.smsRemaining = Math.max(0, 5 - (r?.count ?? 0))),
      error: () => (this.smsRemaining = 5),
    });
  }

  // ---------- optional per-card comms log ----------
  onToggleLog(course: any, checked: boolean) {
    course.showLog = checked;
    if (checked && !course.comms) {
      this.loadRecentCommsForUser(course);
    }
  }

  private loadRecentCommsForUser(course: any): void {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.comms.listMe({ from, limit: 200 }).subscribe({
      next: (rows) => {
        course.comms = rows;
        this.cdr.markForCheck(); // <-- force view update under OnPush
      },
      error: () => {
        course.comms = [];
        this.cdr.markForCheck();
      }
    });
  }

  totalAlerts(course: any): string {
    return (course?.dates ?? []).reduce((sum: number, d: any) => {
      return sum + ((d?.teeTimes ?? []).length);
    }, 0);
  }

  // ---------- helpers used in template ----------
  trackCourse = (_: number, c: any) => c?.courseId;
  trackTeeTime = (_: number, t: any) => t?.notificationId || t?.time;

  typeSeverity(type: string) {
    switch (type) {
      case 'email': return 'success';
      case 'sms': return 'info';
      case 'push': return 'warning';
      default: return 'secondary';
    }
  }

  statusSeverity(status: string) {
    switch (status) {
      case 'sent': return 'success';
      case 'queued': return 'info';
      case 'skipped': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
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
        bookingUrl: notification.BookingUrl,
        availableSpots: notification.AvailableSpots,
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
