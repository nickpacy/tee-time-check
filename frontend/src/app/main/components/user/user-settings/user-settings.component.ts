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
  }

  get f() {
    return this.torreyPinesLoginForm.controls;
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