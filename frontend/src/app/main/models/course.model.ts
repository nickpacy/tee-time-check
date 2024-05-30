import { FullTimeCheck } from "./timecheck.model";

export class Course {
    CourseId!: number;
    CourseName!: string;
    CourseAbbr!: string;
    BookingClass!: number;
    BookingPrefix!: string;
    ScheduleId!: number;
    Method!: string;
    CourseImage!: string;
    ImageUrl!: string;
    WebsiteId!: string;
    BookingUrl!: string;
    Latitude: number;
    Longitude: number;
    TimeZone: string
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