import { FullTimeCheck } from "./timecheck.model";

export class Course {
    CourseId!: number;
    CourseName!: string;
    BookingClass!: number;
    ScheduleId!: number;
    Method!: string;
    ImageUrl!: string;
    Latitude: number;
    Longitude: number;
    Timechecks!: FullTimeCheck[];
}

export class UserCourse extends Course {
    SortOrder!: number;
    Active!: boolean;
    Distance!: number;
    Miles!: number;
    UserCourseActive!: boolean;
    UserCourseEnabled!: boolean;
    Animating: boolean = false;

}