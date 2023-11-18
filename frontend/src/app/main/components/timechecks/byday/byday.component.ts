import { Component, Injectable, OnInit } from '@angular/core';
import { TimecheckService } from '../../../service/timecheck.service';
import { MessageService } from 'primeng/api';
import { CourseService } from '../../../service/course.service';
import { Course } from '../../../models/course.model';
import { UtilityService } from '../../../service/utility.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: "app-byday",
  templateUrl: "./byday.component.html",
  styleUrls: ["./byday.component.scss"],
})
export class BydayComponent implements OnInit {
  daysOfWeek = [
    { id: 0, name: "Sunday", shortName: "Sun", shorterName: "Su" },
    { id: 1, name: "Monday", shortName: "Mon", shorterName: "Mo" },
    { id: 2, name: "Tuesday", shortName: "Tue", shorterName: "Tu" },
    { id: 3, name: "Wednesday", shortName: "Wed", shorterName: "We" },
    { id: 4, name: "Thursday", shortName: "Thu", shorterName: "Th" },
    { id: 5, name: "Friday", shortName: "Fri", shorterName: "Fr" },
    { id: 6, name: "Saturday", shortName: "Sat", shorterName: "Sa" },
  ];
  dayOfWeek: number = 0;
  timechecks: any[] = [];
  activeDayTimechecks: any[];
  courses: Course[]; // Add your course names here
  selectedCourses: number[];
  numberOfPlayers: number = 1;
  timeRange: number[] = [30, 65];
  playerOptions: number[] = [1, 2, 3, 4];
  searchTimeInterval: number[] = this.utilityService.getSunTimes();
  maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 15));
  minDate: Date = new Date();
  startTime: string;
  endTime: string;
  helpDialog: boolean = false;

  constructor(
    public utilityService: UtilityService,
    private messageService: MessageService,
    private courseService: CourseService,
    public layoutService: LayoutService,
    private timecheckService: TimecheckService
  ) {}

  ngOnInit(): void {
    this.getAllCourses();
    this.getTimechecksByDay().then(() => {
      this.setActiveDay(this.dayOfWeek);
    });
  }

  async getTimechecksByDay() {
    const data = await firstValueFrom(
      this.timecheckService.getTimechecksByDay()
    );
    this.timechecks = data;
  }

  async getAllCourses() {
    const data = await firstValueFrom(this.courseService.getUserCourses());
    this.courses = data.filter((x) => Boolean(x.Active));
  }

  setActiveDay(dayOfWeek) {
    var i = this.timechecks.findIndex((x) => x.id == dayOfWeek);
    this.activeDayTimechecks = this.timechecks[i].Timechecks;
    this.activeDayTimechecks.map((x) => {
      x.Active = Boolean(x.Active);
    });
    this.selectedCourses = this.activeDayTimechecks
      .filter((x) => Boolean(x.Active))
      .map((x) => x.CourseId);
  }

  updateCourseActive(e) {
    var activeCourses = e.value;

    // Iterate over each timecheck in the activeTimechecks array
    this.activeDayTimechecks.forEach((timecheck) => {
      if (activeCourses.includes(timecheck.CourseId)) {
        timecheck.Active = true;
      } else {
        timecheck.Active = false;
      }
    });
  }

  async onSave() {
    this.activeDayTimechecks.map((x) => {
      x.StartTime = this.utilityService.convertIntervalToUTCTimeString(
        this.searchTimeInterval[0]
      );
      x.EndTime = this.utilityService.convertIntervalToUTCTimeString(
        this.searchTimeInterval[1]
      );
      x.NumPlayers = this.numberOfPlayers;
    });

    const data = await firstValueFrom(
      this.timecheckService.bulkUpdateTimechecks(this.activeDayTimechecks)
    );
    this.messageService.add({
      severity: "success",
      summary: "Timechecks Saved",
      detail: "Changes saved successfully!",
    });
    var i = this.timechecks.findIndex((x) => x.id == this.dayOfWeek);
    this.timechecks[i].Timechecks = this.activeDayTimechecks;
  }
}
