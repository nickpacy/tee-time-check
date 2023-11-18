import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { TimecheckService } from '../../service/timecheck.service';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  USERID!: number;
  activeTimechecks!: number;
  activeCourses!: number;

  constructor(
    public layoutService: LayoutService,
    private authService: AuthService,
    private messagingService: MessageService,
    private timecheckService: TimecheckService
  ) {}

  ngOnInit() {
    this.USERID = this.authService.getUserId();
    this.getActiveTimecheckCountByUserId();
  }

  async getActiveTimecheckCountByUserId() {
    const data = await firstValueFrom(this.timecheckService.getActiveTimecheckCountByUserId());
    this.activeTimechecks = data.activeTimechecksCount;
    this.activeCourses = data.activeCourseCount;
  }

  async setTimechecksInactive() {
    const userConfirmed = window.confirm(
      "You will no longer be notified for tee times until you setup new ones"
    );
    if (!userConfirmed) return;
    const data = await firstValueFrom(this.timecheckService.resetTimechecks());
    this.activeTimechecks = 0;
    this.activeCourses = 0;
    this.messagingService.add({
      severity: "success",
      detail: "All notifications turned off.",
      life: 2000,
    });
  }
}
