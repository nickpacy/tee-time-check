import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { User } from '../../models/user.model';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  users: User[] = [];
  user: User =  new User();
  userDialog: boolean = false;
  submitted: boolean = false;
  deleteUserDialog: boolean = false;

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    return new Promise((resolve, reject) => {
      this.userService.getUsers().subscribe(
        (data: any[]) => {
          this.users = data;
          console.log('Users:', this.users);
          resolve(true);
        },
        (error) => {
          console.error('Error getting users:', error);
          reject(true);
        }
      );
    });
  }

  onNew() {
    this.user = new User();
    this.submitted = false;
    this.userDialog = true;
  }

  onEdit(user: User) {
    this.user = user;
    this.user.Active = Boolean(this.user.Active);
    this.submitted = false;
    this.userDialog = true;
  }

  onDelete(user: User) {
    this.user = user;
    this.deleteUserDialog = true;
  }

  onSave() {
    this.submitted = true;

    if (this.user.Name?.trim() && this.user.Email?.trim()) {
      if (this.user.UserId) {
        //Existing User

        this.userService.updateUser(this.user.UserId, this.user)
          .subscribe(data => {
            console.log(data);
            this.userDialog = false;
            this.getUsers();
          }, error => {
            console.error(error);
          });

      } else {
        //New User
        console.log(this.user);
        
        this.userService.createUser(this.user)
          .subscribe(data => {
            console.log("New User:", data);
            this.userDialog = false;
            
            this.getUsers();
          }, error => {
            console.error('Error adding user:', error);
          });
      }

    }
  }

  onCancel() {
    this.userDialog = false;
  }

  onConfirmDelete() {
    const userId = this.user.UserId
    if (userId) {
      return new Promise((resolve, reject) => {
        this.userService.deleteUser(userId).subscribe(
          (data: any[]) => {
            console.log(data);
            this.deleteUserDialog = false;
            this.getUsers();
            resolve(true);
          },
          (error) => {
            console.error('Error getting users:', error);
            reject(true);
          }
        );
      });
    } else {
      return false;
    }

    
  }




}
