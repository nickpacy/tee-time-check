import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/main/service/user.service';
import { IUser } from 'src/app/main/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { error, log } from 'console';
import { GeolocationService } from 'src/app/main/service/geolocation.service';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom, take } from 'rxjs';


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
  newLocationData: boolean = false;
  
  constructor(private authService: AuthService,
              private userService: UserService,
              private route: ActivatedRoute,
              private router: Router,
              private messageService: MessageService,
              private geolocationService: GeolocationService,
              private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      Name: ['', Validators.required],
      Email: ['', [Validators.required, Validators.email]],
      Phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      Zip: ['', Validators.required],
      EmailNotification: [false],
      PhoneNotification: [false],
      Admin: [false],
      Active: [false]
    });

    

    
    this.authService.getUser().pipe(filter(user => user !== null), distinctUntilChanged(), debounceTime(100)).subscribe(loggedInUser => {

      if (loggedInUser) {

        this.isAdmin = loggedInUser.Admin;

        if (this.isAdmin) {
          this.route.params.subscribe(params => {
            const userId = params['userId'];
      
            // Check if the logged-in user is an Admin
            if (this.isAdmin && userId > 0 && loggedInUser.UserId != userId) {
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
  get zip() { return this.userForm?.get('Zip') ?? null; }

  async setUserForm(user: IUser) {
    // Transform 0/1 values to false/true
    user.EmailNotification = Boolean(user.EmailNotification);
    user.PhoneNotification = Boolean(user.PhoneNotification);
    user.Admin = Boolean(user.Admin);
    user.Active = Boolean(user.Active);

    if (user.Latitude && user.Latitude) {
      const locData = await firstValueFrom(this.geolocationService.getReverseGeocodingData(user.Latitude, user.Longitude));
      user.Zip = locData.address.postcode;
    } else {
      const locData: any = await this.getLocation();
      this.newLocationData = true;
      user.Zip = locData.Zip;
      this.currentUser.Latitude = locData.Latitude;
      this.currentUser.Longitude = locData.Longitude;
    }

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

  async onSubmit() {
    if (this.userForm.valid) {
      if (!this.userForm.value.PhoneNotification && !this.userForm.value.EmailNotification) {
        const userConfirmed = window.confirm("Both Phone and Email notifications are turned off. Your timechecks will be set to inactive. Are you sure you want to proceed?");
        if (!userConfirmed) return;
      }
      console.log(this.userForm.value);
      var constData = this.userForm.value;
      if (this.newLocationData) {
        if (this.currentUser.Latitude && this.currentUser.Longitude) {
          constData.Latitude = this.currentUser.Latitude;
          constData.Longitude = this.currentUser.Longitude;
        } else {
          const latLong = await firstValueFrom(this.geolocationService.getCoordinatesFromZip(constData.Zip));
          constData.Latitude = latLong[0].lat;
          constData.Longitude = latLong[0].lon;
        }
      }
      this.userService.updateUser(this.currentUser.UserId, constData).subscribe(res => {
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
          console.log(error);
        });
    }

  }

  getLocation() {
    return new Promise((resolve, reject) => {
      this.geolocationService.getCurrentLocation()
        .then(data => {
          console.log('address: ' , data.address);
          const locationData = {
            Zip: data.address.address.postcode,
            Latitude: data.address.lat,
            Longitude: data.address.lon,
          }
          resolve(locationData);
        })
        .catch(error => {
          const locationData = {
            Zip: null,
            Latitude: null,
            Longitude: null,
          }
          resolve(locationData);
          console.error('Geolocation error: ', error);
        });
    });
  }

  getCoordinates(zipCode: string = "92104") {
    this.geolocationService.getCoordinatesFromZip(zipCode)
      .subscribe(
        data => {
          if (data && data.length) {
            console.log('Latitude:', data[0].lat);
            console.log('Longitude:', data[0].lon);
          } else {
            console.log('No coordinates found for this zip code.');
          }
        },
        error => console.error('Geocoding error: ', error)
      );
  }

}