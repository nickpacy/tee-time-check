import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss']
})
export class ChangePasswordFormComponent implements OnInit {
  @Output() formSaved: EventEmitter<void> = new EventEmitter<void>();
  changePasswordForm!: FormGroup;

  constructor(private fb: FormBuilder,
              private authService: AuthService) { }

  ngOnInit() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6), this.passwordMatchValidator]]
    });
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
  
    if (newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
  
    return null;
  }

  onSubmit() {
    console.log("Submt")
    if (this.changePasswordForm.valid) {
      const currentPassword = this.f['currentPassword'].value;
      const newPassword = this.f['newPassword'].value;

      let user = {
        UserId: this.authService.getUserId(),
        OldPassword: currentPassword,
        NewPassword: newPassword
      };
      
      console.log(user)
      this.authService.changePassword(user)
        .subscribe(result => {
            console.log("Change Password Result", result);
            // Emit the custom event to notify the parent component
            this.formSaved.emit();

            // Optionally, you can also reset the form after saving
            this.changePasswordForm.reset();
        }, error => {
            console.error("Login Error", error);

        })

    }
  }
}