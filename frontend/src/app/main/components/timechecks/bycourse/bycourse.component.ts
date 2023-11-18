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
import { firstValueFrom } from 'rxjs';

@Component({
  selector: "app-bycourse",
  templateUrl: "./bycourse.component.html",
  styleUrls: ["./bycourse.component.scss"],
})
export class BycourseComponent {
  loading: boolean = true;
  USERID: number = 0;
  timechecks: FullTimeCheck[] = [];
  emailDialog: boolean = false;
  userEmail: string = "";
  timecheck: TimecheckEntry = new TimecheckEntry();
  submitted: boolean = false;
  timecheckDialog: boolean = false;
  helpDialog: boolean = false;

  timeRange: number[] = [20, 65];

  selectedCourse: Course = new Course();

  activeTemplate: boolean = false;
  copyTemplate: any[] = [];

  courses: Course[] = [];
  daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public utilityService: UtilityService,
    private messageService: MessageService,
    private userService: UserService,
    private courseService: CourseService,
    public layoutService: LayoutService,
    private timecheckService: TimecheckService
  ) {}

  ngOnInit(): void {
    this.getTimechecksByCourse();
  }

  async getTimechecksByUser() {
    const data = await firstValueFrom(
      this.timecheckService.getTimechecksByUserId()
    );
    this.timechecks = data;
    this.timechecks.map((x) => {
      x.DayName = this.utilityService.dayName(x.DayOfWeek);
      x.Active = Boolean(x.Active);
    });
  }

  onNew() {
    this.timecheck = new TimecheckEntry();
    this.submitted = false;
    this.timecheckDialog = true;
  }

  onEdit(timecheck: TimecheckEntry) {
    this.timecheck = timecheck;
    this.timecheck.StartDate = this.utilityService.localTime(
      timecheck.StartTime
    );
    this.timecheck.EndDate = this.utilityService.localTime(timecheck.EndTime);

    this.submitted = false;
    this.timecheckDialog = true;
  }

  async onSave(timecheck?: Timecheck) {
    let update = new Timecheck();
    if (!timecheck) {
      this.submitted = true;

      this.timecheck.UserId = this.USERID;
      this.timecheck.StartTime = this.utilityService.utcTime(
        this.timecheck.StartDate
      );
      this.timecheck.EndTime = this.utilityService.utcTime(
        this.timecheck.EndDate
      );

      update = this.timecheck;
    } else {
      update = timecheck;
    }
    if (update.Id) {
      // Edit Timecheck
      const data = await firstValueFrom(
        this.timecheckService.updateTimecheck(update.Id, update)
      );
    } else {
      //Create New
      const data = await firstValueFrom(
        this.timecheckService.createTimecheck(update)
      );
    }
    this.timecheckDialog = false;
    this.getTimechecksByUser();
  }

  async onDelete(timecheck: TimecheckEntry) {
    const id = timecheck.Id;

    if (id) {
      const data = await firstValueFrom(
        this.timecheckService.deleteTimecheck(id)
      );
      this.getTimechecksByUser();
    }
  }

  async getTimechecksByCourse() {
    const data = await firstValueFrom(
      this.timecheckService.getTimechecksByCourse()
    );
    this.courses = data;
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

  async getTimechecks(courseId: number) {
    const data = await firstValueFrom(
      this.timecheckService.getTimechecksByUserIdAndCourseId(courseId)
    );
    this.timechecks = data;
    this.timechecks.map((x) => {
      x.DayName = this.utilityService.dayName(x.DayOfWeek);
      x.Active = Boolean(x.Active);
      x.TimeInterval = this.utilityService.convertTimeToInterval(
        x.StartTime,
        x.EndTime
      );
    });
  }

  async onBulkSaveTimechecks(setTemplate = false) {
    if (this.timechecks.length > 0) {
      this.timechecks.map((x: FullTimeCheck) => {
        x.StartTime = this.utilityService.convertIntervalToUTCTimeString(
          x.TimeInterval[0]
        );
        x.EndTime = this.utilityService.convertIntervalToUTCTimeString(
          x.TimeInterval[1]
        );
      });
      const data = await firstValueFrom(
        this.timecheckService.bulkUpdateTimechecks(this.timechecks)
      );

      let courseId = this.timechecks[0].CourseId;

      // find the index of the course with the given courseId
      let courseIndex = this.courses.findIndex(
        (course) => course.CourseId === courseId
      );

      // check if a course was found
      if (courseIndex !== -1) {
        // update the timechecks for the course
        this.courses[courseIndex].Timechecks = this.timechecks.sort(
          (a, b) => a.DayOfWeek - b.DayOfWeek
        );
      }

      if (this.activeTemplate && this.copyTemplate?.length == 0) {
        // Setup copy template
        this.copyTemplate = JSON.parse(JSON.stringify(this.timechecks));
      }

      this.timecheckDialog = false;
    }
  }

  hasActiveTimechecks(timechecks: any[]): boolean {
    return timechecks && timechecks.some((x) => x.Active);
  }

  numActiveTimechecks(timechecks: any[]): number {
    return timechecks.filter((x) => x.Active).length;
  }

  pasteTemplateToCourse() {
    // If no template is set, exit early
    if (this.copyTemplate?.length == 0) {
      console.warn("No template set");
    }

    // Iterate over the current timechecks
    let newTimechecks = this.timechecks.map((timecheck, index) => {
      if (index < this.copyTemplate.length) {
        // Overwrite the properties from the template while preserving courseId and id
        let templateCopy = { ...this.copyTemplate[index] };
        delete templateCopy.CourseId;
        delete templateCopy.Id;

        return { ...timecheck, ...templateCopy };
      }
      return timecheck; // if index exceeds copyTemplate length, return original
    });

    // Sort the timechecks based on DayOfWeek
    this.timechecks = newTimechecks.sort((a, b) => {
      if (a.DayOfWeek === 0) return 1;
      if (b.DayOfWeek === 0) return -1;
      return a.DayOfWeek - b.DayOfWeek;
    });
  }
}
