import { FullTimeCheck } from "./timecheck.model";

export class Course {
    CourseId!: number;
    CourseName!: string;
    BookingClass!: number;
    ScheduleId!: number;
    Method!: string;
    ImageUrl!: string;
    Timechecks!: FullTimeCheck[];
}