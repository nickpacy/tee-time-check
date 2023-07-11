export class Timecheck {
    Id?: number;
    UserId?: number;
    DayOfWeek?: number;
    StartTime: string = '';
    EndTime: string = '';
    CourseId?: number;
    NumPlayers?: number;
}

export class TimecheckEntry extends Timecheck {
    StartDate: Date = new Date;
    EndDate: Date = new Date;
}

export class FullTimeCheck {
  Active?: boolean;
  BookingClass?: number;
  CourseId?: number;
  CourseName?: string;
  DayOfWeek: number = -1;
  DayName?: string;
  Email?: string;
  EndTime: string = '';
  ET?: any;
  Id?: number;
  Name?: string;
  NumPlayers?: number;
  ScheduleId?: number;
  StartTime: string = '';
  UserId?: number;
  TimeInterval!: number[];
}