import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserSetting } from 'src/app/main/models/user.model';
import { UserService } from 'src/app/main/service/user.service';

@Component({
  selector: "app-user-settings",
  templateUrl: "./user-settings.component.html",
  styleUrls: ["./user-settings.component.scss"],
})
export class UserSettingsComponent {
  @Output() formSaved: EventEmitter<any> = new EventEmitter<any>();
  settingsForm!: FormGroup;
  isLoading: boolean = true;

  userSettings = {
    TorreyPinesLoginEmail: {
      value: "",
      encrypt: false,
    },
    TorreyPinesLoginPassword: {
      value: "",
      encrypt: true,
    },
    TorreyPinesLoginActive: {
      value: false,
      encrypt: false,
    },
  };

  constructor(private fb: FormBuilder, private userService: UserService) {}

  ngOnInit() {
    this.isLoading = true;
    this.getUserSettings();
  }

  getUserSettings() {
    this.userService.getUserSettings().subscribe(
      (result) => {
        console.log(result);
        for (const setting of result) {
          if (this.userSettings[setting.settingKey]) {
            if (setting.settingValue === 1 || setting.settingValue === '1') {
                this.userSettings[setting.settingKey].value = true;
            } else if (setting.settingValue === 0 || setting.settingValue === '0') {
                this.userSettings[setting.settingKey].value = false;
            } else {
                this.userSettings[setting.settingKey].value = setting.settingValue;
            }
          }
        }
        this.createForm(this.userSettings);
      },
      (error) => {
        console.error("Error:", error);
      }
    );
  }

  createForm(settings: any) {
    this.settingsForm = this.fb.group({
      TorreyPinesLoginEmail: [settings.TorreyPinesLoginEmail.value],
      TorreyPinesLoginPassword: [settings.TorreyPinesLoginPassword.value],
      TorreyPinesLoginActive: [settings.TorreyPinesLoginActive.value],
    });
    this.isLoading = false;
  }

  onFormSubmit() {
    const formValues = this.settingsForm.value;
    const settingsArray = [
      {
        settingKey: "TorreyPinesLoginEmail",
        settingValue: formValues.TorreyPinesLoginEmail,
        encrypt: this.userSettings.TorreyPinesLoginEmail.encrypt,
      },
      {
        settingKey: "TorreyPinesLoginPassword",
        settingValue: formValues.TorreyPinesLoginPassword,
        encrypt: this.userSettings.TorreyPinesLoginPassword.encrypt,
      },
      {
        settingKey: "TorreyPinesLoginActive",
        settingValue: formValues.TorreyPinesLoginActive,
        encrypt: this.userSettings.TorreyPinesLoginActive.encrypt,
      },
    ];

    this.userService.updateUserSetting(settingsArray).subscribe(
      (result) => {
        // Emit the custom event to notify the parent component
        this.formSaved.emit({severity: "success", detail: `${result.message}`, life: 3000});
      },
      (error) => {
        console.error("Login Error", error);
        this.formSaved.emit({severity: "error", summary: "Login Error", detail: error.error.message, life: 3000});
      }
    );
  }
}