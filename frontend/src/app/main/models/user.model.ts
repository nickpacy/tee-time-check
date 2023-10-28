export class User {
    UserId?: number;
    Name!: string;
    Email!: string;
    Active?: boolean = true;
}

export interface IUser {
    UserId: number;
    Name: string;
    Email: string;
    Phone: string;
    EmailNotification: boolean;
    PhoneNotification: boolean;
    Active: boolean;
    Admin: boolean;
}

export interface UserSetting {
    settingKey: string;
    settingValue: string | boolean | number;
    encrypt: boolean;
  }