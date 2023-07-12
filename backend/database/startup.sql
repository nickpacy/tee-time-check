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
  ScheduleId INT NOT NULL,
  BookingPrefix VARCHAR(50) NULL,
  WebsiteId VARCHAR(255) NULL,
  Method VARCHAR(50) NULL,
  ImageUrl VARCHAR(255) NULL,
  BookingUrl VARCHAR(255) NULL
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
`Email`,
`Password`,
`Active`,
`Admin`)
VALUES
(
'Nick',
'nickpacy@gmail.com',
'$2b$10$Fzh2hP5EO/FAKG.bpcJU/esOn3l.gt/WCSBwanJJ5fa9.Ps0E2Lsi',
1,
1);



/**************************************************
              Data to insert
**************************************************/
INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('1', 'Torrey Pines South', '888', '1487', NULL, NULL, 'foreup', 'torrey-pines-south.png', 'https://foreupsoftware.com/index.php/booking/19347/1487#/teetimes');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('2', 'Torrey Pines North', '1135', '1468', NULL, NULL, 'foreup', 'torrey-pines-north.png', 'https://foreupsoftware.com/index.php/booking/19347/1487#/teetimes');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('3', 'Balboa Park', '929', '1470', NULL, NULL, 'foreup', 'balboa.png', 'https://foreupsoftware.com/index.php/booking/19348/1470/#/teetimes');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('4', 'Admiral Baker North', '28', '0', NULL, NULL, 'navy', 'admiral-baker-north.png', NULL);

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('5', 'Coronado', '20610', '0', NULL, NULL, 'teeitup', 'coronado.png', 'https://www.golfcoronado.com/teetimes');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('6', 'Sea \'N Air', '27', '0', NULL, NULL, 'navy', 'sea-n-air.png', NULL);

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('7', 'Encinitas Ranch', '6', '0', 'sc5', '94ce5060-0b39-444f-2756-08d8d81fed21', 'jcgolf', 'encinitas-ranch.png', 'https://jcgsc5.cps.golf/onlineresweb/search-teetime');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('8', 'Crossings', '22', '0', 'sc29', '3d71f309-348c-408c-684f-08d8d8207bf5', 'jcgolf', 'crossings.png', 'https://jcgsc29.cps.golf/onlineresweb/search-teetime');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('9', 'Rancho Bernardo Inn', '2', '0', 'sc2', 'd5b2d33a-ba34-4eb5-1fa4-08d8ddcb819c', 'jcgolf', 'rancho-bernardo.png', 'https://jcgsc2.cps.golf/onlineresweb/search-teetime');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('10', 'Twin Oaks', '4', '0', 'sc4', '46994cb7-5a59-439f-7db9-08d8d81f86f7', 'jcgolf', 'twin-oaks.png', 'https://jcgsc4.cps.golf/onlineresweb/search-teetime');

INSERT INTO Courses (CourseId, CourseName, BookingClass, ScheduleId, BookingPrefix, WebsiteId, Method, ImageUrl, BookingUrl)
VALUES ('11', 'Golf Club of California', '23', '0', 'pub32', '3fe876a0-f294-4819-30f3-08d9c17322b2', 'jcgolf', 'golf-club-of-california.png', 'https://jcgpub32.cps.golf/onlineresweb/search-teetime');





DELIMITER $$
CREATE PROCEDURE `AddTimechecksForNewUser`(
    IN p_UserId INT
)
BEGIN
    -- Insert inactive timechecks for the user for every course and day combination
    INSERT INTO Timechecks (UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active)
    SELECT
        p_UserId AS UserId,
        dw.DayOfWeek,
        '13:00:00' AS StartTime,
        '19:00:00' AS EndTime,
        c.CourseId,
        1 AS NumPlayers,
        0 AS Active
    FROM
        Courses c
    CROSS JOIN
        (
            SELECT 0 AS DayOfWeek UNION ALL
            SELECT 1 AS DayOfWeek UNION ALL
            SELECT 2 AS DayOfWeek UNION ALL
            SELECT 3 AS DayOfWeek UNION ALL
            SELECT 4 AS DayOfWeek UNION ALL
            SELECT 5 AS DayOfWeek UNION ALL
            SELECT 6 AS DayOfWeek
        ) dw
    WHERE NOT EXISTS (
        SELECT 1
        FROM Timechecks t
        WHERE t.UserId = p_UserId
          AND t.CourseId = c.CourseId
          AND t.DayOfWeek = dw.DayOfWeek
    );
END$$
DELIMITER ;


CALL `TTC`.`AddTimechecksForNewUser`(1);


-- Query for Getting Unique found tee times
SELECT UserId, CourseId, TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(NotifiedTeeTimes, ',', numbers.n), ',', -1)) AS TeeTimes
FROM TTC.Notifications
JOIN (SELECT @row := @row + 1 AS n FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) t, (SELECT @row := 0) r) numbers
ON CHAR_LENGTH(NotifiedTeeTimes) - CHAR_LENGTH(REPLACE(NotifiedTeeTimes, ',', '')) >= numbers.n - 1
ORDER BY TeeTimes;