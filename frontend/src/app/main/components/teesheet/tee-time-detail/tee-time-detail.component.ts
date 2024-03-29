import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { Course } from 'src/app/main/models/course.model';
import { CourseService } from 'src/app/main/service/course.service';
import { FriendService } from 'src/app/main/service/friend.service';
import { TeeSheetService } from 'src/app/main/service/teesheet.service';
import { UtilityService } from 'src/app/main/service/utility.service';

@Component({
  selector: 'app-tee-time-detail',
  templateUrl: './tee-time-detail.component.html',
  styleUrls: ['./tee-time-detail.component.scss']
})
export class TeeTimeDetailComponent implements OnInit, OnChanges {
  @Input() teeSheetId: number = 0;

  today = new Date();
  teeTimeDetail: any;
  courses: Course[];
  players = [];
  friends = [];
  gotFriends: boolean = false;
  allFriends = [];
  inviteList = [];
  guest: string;
  showGuest: boolean = false;
  showAddFriend: boolean = false;
  addFriendUserId: number;
  activeTab: number = 0;
  col = 'col-12';
  teeSheetForm = new FormGroup({
    courseId: new FormControl({value: '', disabled: false}, Validators.required,),
    teeTime: new FormControl({value: new Date(), disabled: false}, Validators.required),
    totalSpots: new FormControl('', [Validators.required, Validators.min(1)])
  });

  constructor(private courseService: CourseService,
              private teesheetService: TeeSheetService,
              private friendService: FriendService,
              private messageService: MessageService,
              public layoutService: LayoutService,
              private utilityService: UtilityService){}

  ngOnInit(): void {
      this.getAllCourses();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['teeSheetId']) {
      const change = changes['teeSheetId'];
  
      if (change.currentValue > 0) {
        // If teeSheetId is greater than 0, fetch tee time details
        this.getTeeTime(change.currentValue);
        if (!this.gotFriends) {
          await this.getFriends();
        }
        this.getTeeTimePlayers(change.currentValue);
        this.col = 'col-5';
        this.activeTab = 1;
      } else {
        // If teeSheetId is 0, reset the form
        this.col = 'col-12';
        this.teeTimeDetail = {};
        this.activeTab = 0;
        this.teeSheetForm.reset({
          courseId: '',
          teeTime: new Date(),
          totalSpots: ''
        });
        this.teeSheetForm.get('courseId')?.enable();
        this.teeSheetForm.get('teeTime')?.enable();
        this.teeSheetForm.get('totalSpots')?.enable();
      }
    }
  }
  

  async getAllCourses() {
    this.courses = await firstValueFrom(this.courseService.getUserCourses({ all: true }));
  }

  async getTeeTime(teeSheetId: number) {
    try {
      this.teeTimeDetail = await firstValueFrom(this.teesheetService.getTeeTimeById(teeSheetId));
      console.log(this.teeTimeDetail);
      const teeTimeDate = new Date(this.teeTimeDetail.TeeTime);
      const teeTimeString = teeTimeDate.toISOString().slice(0, 16); // Adjust the format as needed
  
      this.teeSheetForm.setValue({
        courseId: this.teeTimeDetail.CourseId,
        teeTime: new Date(this.teeTimeDetail.TeeTime),
        totalSpots: this.teeTimeDetail.TotalSpots
      });

      if (this.teeTimeDetail.Status === 'reserved') {
        this.teeSheetForm.get('courseId')?.disable();
        this.teeSheetForm.get('teeTime')?.disable();
        this.teeSheetForm.get('totalSpots')?.disable();
      }

    } catch (error) {
      console.error("Error fetching tee time details:", error);
      // Handle error appropriately
    }
  }
  
  async getTeeTimePlayers(teeTimeId: number) {
    this.players = await firstValueFrom(this.teesheetService.getTeeTimePlayers(teeTimeId));
    console.log(this.players);
    this.filterFriends();
  }

  async getFriends() {
    this.allFriends = await firstValueFrom(this.friendService.getFriends('accepted'));
    this.gotFriends = true;
    // console.log(this.allFriends);
  }

  filterFriends() {
    const playerUserIds = this.players.filter(x => x.UserId != null).map(player => player.UserId);
    this.friends = this.allFriends.filter(friend => 
      !playerUserIds.includes(friend.FriendUserId)
    );
    // console.log(this.friends);
  }

  async addFriendToTeeSheet() {
    if (this.addFriendUserId > 0) {
      await firstValueFrom(this.teesheetService.addFriendPlayer(this.teeSheetId, this.addFriendUserId));
      await this.getTeeTime(this.teeSheetId);
      this.addFriendUserId = null;
      this.showAddFriend = false;
      this.getTeeTimePlayers(this.teeSheetId);
    } else {
      this.messageService.add({severity:'error',detail: 'Friend Selection Required'});
    }
  }

  async addGuest() {
    if (this.guest != null && this.guest != '') {
      await firstValueFrom(this.teesheetService.addGuestPlayer(this.teeSheetId, this.guest));
      await this.getTeeTime(this.teeSheetId);
      this.guest = '';
      this.showGuest = false;
      this.getTeeTimePlayers(this.teeSheetId);
    } else {
      this.messageService.add({severity:'error',detail: 'Guest Name Required'});
    }
  }

  async removePlayer(teeSheetPlayerId: number) {
    await firstValueFrom(this.teesheetService.removePlayer(teeSheetPlayerId));
    await this.getTeeTime(this.teeSheetId);
    this.getTeeTimePlayers(this.teeSheetId);
  }

  async onSubmit() {
    const teeTimeLocal = new Date(this.teeSheetForm.value.teeTime);
    const teeTimeData = {
      CourseId: this.teeSheetForm.value.courseId,
      TeeTime: teeTimeLocal.toISOString().slice(0, 19).replace('T', ' '), // format as 'YYYY-MM-DD HH:MM:SS',
      TotalSpots: this.teeSheetForm.value.totalSpots
    }
    console.log("Submitted", teeTimeData);
    if (this.teeSheetId == 0) {
      const newTime = await firstValueFrom(this.teesheetService.createTeeTime(teeTimeData));
      if (!this.gotFriends) {
        await this.getFriends();
      }
      console.log("New Tee Time", newTime)
      this.teeSheetId = newTime.TeeSheetId;
      this.teeTimeDetail = newTime;
      this.col = 'col-5';
      await this.getTeeTimePlayers(newTime.TeeSheetId);
      this.activeTab = 1;
    } else {

      const activePlayers = this.players.filter(x => x.TeeSheetId);
      if (activePlayers.length > +teeTimeData.TotalSpots) {
        this.messageService.add({severity:'error',detail: 'There are more players confirmed than spots you are trying to select. Please remove a player or pick a greater amount of spots.'});
      } else {
        const updatedTeeTime = await firstValueFrom(this.teesheetService.updateTeeTime(this.teeSheetId, teeTimeData));
        this.getTeeTimePlayers(updatedTeeTime.TeeSheetId);
      }

    }
    
  }


  async invitePlayers() {
    console.log(this.inviteList)

    const res = await firstValueFrom(this.teesheetService.addFriendsToNotificationQueue(this.teeSheetId, this.inviteList));
    console.log(res);
  }

  async updateInviteStatus(userId: number, status: string) {
    console.log("Update Queue Status:", userId, status);
    const res = await firstValueFrom(this.teesheetService.updateQueueStatus(this.teeSheetId, userId, status));
    console.log(res);
    this.getTeeTimePlayers(this.teeSheetId);
  }

}

