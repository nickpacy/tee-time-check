import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UtilityService } from 'src/app/main/service/utility.service';
import { UserService } from 'src/app/main/service/user.service';
import { IUser } from 'src/app/main/models/user.model';
import { resolve } from 'path';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userForm!: FormGroup;
  isAdmin!: boolean;
  currentUser!: IUser;
  
  constructor(private authService: AuthService,
              private userService: UserService,
              private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      Name: ['', Validators.required],
      Email: ['', [Validators.required, Validators.email]],
      Phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      EmailNotification: [false],
      PhoneNotification: [false],
      Admin: [false],
      Active: [false]
    });

    this.authService.loadUserFromToken();
    this.authService.getUser().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.isAdmin = user.Admin;

        // Transform 0/1 values to false/true
        user.EmailNotification = Boolean(user.EmailNotification);
        user.PhoneNotification = Boolean(user.PhoneNotification);
        user.Admin = Boolean(user.Admin);
        user.Active = Boolean(user.Active);

        console.log(user)
        this.userForm.patchValue(user);
      }
    });

    // Add this to subscribe to the value changes for the 'Phone' control
    this.userForm.get('Phone')?.valueChanges.subscribe(value => {
      if (value && this.userForm.get('Phone')?.valid) {
        this.userForm.get('PhoneNotification')?.enable();
      } else {
        this.userForm.get('PhoneNotification')?.disable();
        this.userForm.get('PhoneNotification')?.setValue(false);
      }
    });
  }

  get name() { return this.userForm?.get('Name') ?? null; }
  get email() { return this.userForm?.get('Email') ?? null; }

  loadUser() {

  }

  onSubmit() {
    if (this.userForm.valid) {
      console.log(this.userForm.value);
      this.userService.updateUser(this.currentUser.UserId, this.userForm.value).subscribe(res => {
        console.log("res", res);
        this.authService.loadUserFromToken();
      }, (error: any) => {
        console.error(error);
      });
    }
  }
}