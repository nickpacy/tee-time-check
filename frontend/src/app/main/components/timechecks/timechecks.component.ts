import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FullTimeCheck, Timecheck, TimecheckEntry } from '../../models/timecheck.model';
import { TimecheckService } from '../../service/timecheck.service';
import { UserService } from '../../service/user.service';
import { MessageService } from 'primeng/api';
import { CourseService } from '../../service/course.service';
import { Course } from '../../models/course.model';
import { UtilityService } from '../../service/utility.service';
import { AuthService } from '../auth/auth.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
@Component({
  selector: "app-timechecks",
  templateUrl: "./timechecks.component.html",
  styleUrls: ["./timechecks.component.scss"],
})
export class TimechecksComponent implements OnInit {
  loading: boolean = true;
  USERID: number = 0;
  isAdmin!: boolean;
  logoUrl: string = environment.logoUrl;
  timechecks: FullTimeCheck[] = [];
  emailDialog: boolean = false;
  userEmail: string = "";
  timecheck: TimecheckEntry = new TimecheckEntry();
  submitted: boolean = false;
  timecheckDialog: boolean = false;
  loadingDialog: boolean = false;

  timeRange: number[] = [20, 65];

  userTimechecks: any[];

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
    public layoutService: LayoutService,
    private messageService: MessageService,
    private userService: UserService,
    private courseService: CourseService,
    private timecheckService: TimecheckService
  ) {}

  ngOnInit(): void {
    this.getAllUsersActiveTimechecks();

    this.authService.loadUserFromToken();
    this.authService.getUser().subscribe((loggedInUser) => {
      if (loggedInUser) {
        this.isAdmin = loggedInUser.Admin;
      }
    });
  }

  async getAllUsersActiveTimechecks() {
    const data = await firstValueFrom(
      this.timecheckService.getAllUsersActiveTimechecks()
    );
    this.userTimechecks = data;
  }

  async setInactive(user, timecheck) {
    const data = await firstValueFrom(
      this.timecheckService.setTimecheckInactive(timecheck)
    );
    const userIndex = this.userTimechecks.findIndex(
      (u) => u.userId === user.userId
    );

    if (userIndex !== -1) {
      const updatedTimechecks = this.userTimechecks[
        userIndex
      ].timechecks.filter((tc) => tc.timecheckId !== timecheck.timecheckId);

      // Immutable update
      this.userTimechecks = [
        ...this.userTimechecks.slice(0, userIndex),
        {
          ...this.userTimechecks[userIndex],
          timechecks: updatedTimechecks,
        },
        ...this.userTimechecks.slice(userIndex + 1),
      ];
    }
  }
}
