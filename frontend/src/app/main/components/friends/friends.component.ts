import { Component, OnInit } from '@angular/core';
import { filter, first, firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { FriendService } from '../../service/friend.service';
import { UserService } from '../../service/user.service';
import { User } from '../../models/user.model';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent implements OnInit {

  currentUser: User;
  friends: any[]; // To store the current friends
  pending: any[]; // To store the current friends
  users: any[]; // For the autocomplete dropdown
  searchQuery: string; // The query to search users
  selectedUser: User;
  buttonInfo = {
    label: 'Add Friend',
    icon: 'fa fa-user-plus',
    disabled: true
  };

  constructor(
    private friendService: FriendService,
    private userService: UserService,
    public layoutService: LayoutService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
      this.getFriends();
      // this.getPendingFriends();
      this.authService.getUser()
        .pipe(
          filter(user => user !== null), // Ignore null values
          first() // Complete after the first non-null value
        )
        .subscribe(user => {
          this.currentUser = user;
          console.log("CURRENT USER", this.currentUser);
        });
  }


  async getFriends() {
    this.friends = await firstValueFrom(this.friendService.getFriends());
    console.log(this.friends);
  }


  async searchUser(event) {
    if (event.query.length > 0) {
      this.users = await firstValueFrom(this.userService.searchUsers(event.query));
      console.log(this.users);
    } else {
      this.users = [];
    }
  }

  selectUser(event) {
    this.selectedUser = event;
    if (this.selectedUser.UserId == this.currentUser.UserId) {
      this.buttonInfo = {
        label: 'You',
        icon: 'fa fa-fingerprint',
        disabled: true
      }
    } else {

      const i = this.friends.findIndex(x => x.UserId2 == this.selectedUser.UserId || x.UserId1 == this.selectedUser.UserId);
      if (i !== -1) {
        const status = this.friends[i].Status;;
        this.buttonInfo = {
          label: status == 'pending' ? 'Pending' : 'Friends',
          icon: status == 'pending' ? 'fa fa-clock' : 'fa fa-face-smile',
          disabled: true
        }
      } else {
        this.buttonInfo = {
          label: 'Add Friend',
          icon: 'fa fa-user-plus',
          disabled: false
        }
      }
    }
  }

  async addFriend() {
    if (this.selectedUser.UserId) {
      await firstValueFrom(this.friendService.createFriendship(this.selectedUser.UserId));
      await this.getFriends();
      this.searchQuery = '';
      this.selectedUser = null;
    }
  }

  async updateFriendship(friendshipId, status) {
    if (friendshipId && status) {
      await firstValueFrom(this.friendService.updateFriendship(friendshipId, status));
      await this.getFriends();
    }
  }
  

}
