import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/main/service/user.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent {
  @Output() formSaved: EventEmitter<any> = new EventEmitter<any>();
  torreyPinesLoginForm!: FormGroup;

  constructor(private fb: FormBuilder,
              private userService: UserService) { }

  ngOnInit() {
    this.torreyPinesLoginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.getUserSettings();
  }

  get f() {
    return this.torreyPinesLoginForm.controls;
  }

  getUserSettings() {
    this.userService.getUserSettings()
        .subscribe(result => {
          // Find the setting values for email and password
          const emailSetting = result.find(s => s.settingKey === 'TorreyPinesLoginEmail');
          const passwordSetting = result.find(s => s.settingKey === 'TorreyPinesLoginPassword');

          // Decrypt the password here if you are encrypting it before storing

          // Use patchValue to update the form values
          this.torreyPinesLoginForm.patchValue({
              email: emailSetting ? emailSetting.settingValue : '',  // Use a fallback in case the setting doesn't exist
              password: passwordSetting ? passwordSetting.settingValue : '' // Use a fallback in case the setting doesn't exist
          });
        }, error => {
            console.error("Error:", error);
        }) 
  }


  onTorreyPinesLoginFormSubmit() {
    // console.log("Submt")
    if (this.torreyPinesLoginForm.valid) {
      const email = this.f['email'].value;
      const password = this.f['password'].value;

      let userSetting = [{
        settingKey: "TorreyPinesLoginEmail",
        settingValue: email,
        encrypt: false
      }, {
        settingKey: "TorreyPinesLoginPassword",
        settingValue: password,
        encrypt: true
      }];
      
      // console.log(user)
      this.userService.updateUserSetting(userSetting)
        .subscribe(result => {
            // console.log("Change Password Result", result);
            // Emit the custom event to notify the parent component
            this.formSaved.emit({severity:'success', detail: `${result.message}`, life: 3000});

            // Optionally, you can also reset the form after saving
            this.torreyPinesLoginForm.reset();
        }, error => {
            console.error("Login Error", error);
            this.formSaved.emit({severity:'error', summary:'Login Error', detail: error.error.message, life: 3000});
        })

    }
  }
}