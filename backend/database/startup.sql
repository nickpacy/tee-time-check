Use TTC;

CREATE TABLE Users (
  UserId INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(50) NOT NULL,
  Password VARCHAR(250) NOT NULL,
  Email VARCHAR(50) NOT NULL UNIQUE,
  Active BOOLEAN NOT NULL DEFAULT true,
  Admin BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE Courses (
  CourseId INT AUTO_INCREMENT PRIMARY KEY,
  CourseName VARCHAR(50) NOT NULL,
  BookingClass INT NOT NULL,
  ScheduleId INT NOT NULL
);


CREATE TABLE Timechecks (
  Id INT AUTO_INCREMENT PRIMARY KEY,
  UserId INT NOT NULL,
  DayOfWeek INT NOT NULL,
  StartTime TIME NOT NULL,
  EndTime TIME NOT NULL,
  CourseId INT NOT NULL,
  NumPlayers INT NOT NULL,
  Active BOOLEAN NOT NULL DEFAULT true,
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);


CREATE TABLE Notifications (
  Id INT AUTO_INCREMENT PRIMARY KEY,
  UserId INT NOT NULL,
  CourseId INT NOT NULL,
  CheckDate DATE NOT NULL,
  NotifiedTeeTimes VARCHAR(4000) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);



INSERT INTO `TTC`.`Users`
(
`Name`,
`Email`)
VALUES
(
'Nick',
'nickpacy@gmail.com');



INSERT INTO `TTC`.`Courses`
(
`CourseName`,
`BookingClass`,
`ScheduleId`)
VALUES
('Torrey Pines South',
19347,
1487);

INSERT INTO `TTC`.`Courses`
(
`CourseName`,
`BookingClass`,
`ScheduleId`)
VALUES
('Torrey Pines North',
19347,
1468);


INSERT INTO `TTC`.`Courses`
(
`CourseName`,
`BookingClass`,
`ScheduleId`)
VALUES
('Balboa Park',
929,
1470);





INSERT INTO `TTC`.`Timechecks`
(
`UserId`,
`DayOfWeek`,
`StartTime`,
`EndTime`,
`CourseId`,
`NumPlayers`)
VALUES
(
1,
2,
'14:00',
'16:00',
1,
1);


// Different schedule ID (uncomment to use)
// const scheduleId = 1468; // TN schedule ID
// const scheduleId = 1487; // TS schedule ID
// const scheduleId = 1470; // BP schedule ID
// const bookingClass = 19347; //TN booking Class;
// const bookingClass = 19347; //BP booking Class;