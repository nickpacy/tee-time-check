import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
// import { ToastItem } from 'primeng/toast';

@Component({
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss']
})
export class ChangePasswordFormComponent implements OnInit {
  @Output() formSaved: EventEmitter<any> = new EventEmitter<any>();
  changePasswordForm!: FormGroup;

  constructor(private fb: FormBuilder,
              private authService: AuthService) { }

  ngOnInit() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: this.passwordMatchValidator // Apply the validator on the form group
    });
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
  
    if (newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ 'passwordMismatch': true });
    } else {
      // If passwords match, clear the 'passwordMismatch' error
      control.get('confirmPassword')?.setErrors(null);
    }
  
    return null;
  }

  async onSubmit() {
    if (this.changePasswordForm.valid) {
      const currentPassword = this.f['currentPassword'].value;
      const newPassword = this.f['newPassword'].value;

      let user = {
        UserId: this.authService.getUserId(),
        OldPassword: currentPassword,
        NewPassword: newPassword
      };
      const data = await firstValueFrom(this.authService.changePassword(user));
      // Emit the custom event to notify the parent component
      this.formSaved.emit({severity:'success', detail: `${data.message}`, life: 3000});

      // Optionally, you can also reset the form after saving
      this.changePasswordForm.reset();

    }
  }
}