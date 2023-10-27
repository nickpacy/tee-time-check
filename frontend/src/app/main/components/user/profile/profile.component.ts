import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/main/service/user.service';
import { IUser } from 'src/app/main/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'console';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userForm!: FormGroup;
  isAdmin!: boolean;
  currentUser!: IUser;
  passwordDialog: boolean = false;
  settingsDialog: boolean = false;
  
  constructor(private authService: AuthService,
              private userService: UserService,
              private route: ActivatedRoute,
              private router: Router,
              private messageService: MessageService,
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
    this.authService.getUser().subscribe(loggedInUser => {
      if (loggedInUser) {
        this.isAdmin = loggedInUser.Admin;

        if (this.isAdmin) {
          this.route.params.subscribe(params => {
            const userId = params['userId'];
      
            // Check if the logged-in user is an Admin
            if (this.isAdmin && userId > 0) {
              this.userService.getUserById(userId).subscribe(user => {
                if (user) {
                  this.currentUser = user;
                  this.setUserForm(user);
                }
              });
            } else {
              this.currentUser = loggedInUser;
              this.setUserForm(loggedInUser);
            }
          });
        } else {
          this.currentUser = loggedInUser;
          this.setUserForm(loggedInUser);
        }
        
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

  setUserForm(user: IUser) {
    // Transform 0/1 values to false/true
    user.EmailNotification = Boolean(user.EmailNotification);
    user.PhoneNotification = Boolean(user.PhoneNotification);
    user.Admin = Boolean(user.Admin);
    user.Active = Boolean(user.Active);

    // console.log(user)
    this.userForm.patchValue(user);
  }

  onChangePasswordFormSaved(e: any) {
    
    this.passwordDialog = false;
    this.messageService.add(e);
  }

  onSettingsFormSaved(e: any) {
    
    this.settingsDialog = false;
    this.messageService.add(e);
  }

  onSubmit() {
    if (this.userForm.valid) {
      if (!this.userForm.value.PhoneNotification && !this.userForm.value.EmailNotification) {
        const userConfirmed = window.confirm("Both Phone and Email notifications are turned off. Your timechecks will be set to inactive. Are you sure you want to proceed?");
        if (!userConfirmed) return;
      }
      // console.log(this.userForm.value);
      this.userService.updateUser(this.currentUser.UserId, this.userForm.value).subscribe(res => {
        // console.log("res", res);
        this.messageService.add({severity:'success', detail: `${res.message}`, life: 3000});
        this.authService.loadUserFromToken();
      }, (error: any) => {
        console.error(error);
        this.messageService.add({severity:'error',detail: error.error.message});
      });
    }
  }

  deleteUser(userid) {

    if (window.confirm('This will remove the user from the database.')) {
      this.userService.deleteUser(userid)
        .subscribe((res) => {
          // console.log(res);
          this.router.navigate(['/user'])
        }, error => {
          // console.log(error);
        });
    }

  }

}