-- ALTER SCRIPT FOR DATABASE
-- backend/database/alter_script.sql


/***********************************************
                8/11/2025
***********************************************/

ALTER TABLE notifications
ADD COLUMN AvailableSpots INT NULL AFTER NotifiedDate;

ALTER TABLE notifications
ADD COLUMN Active TINYINT(1) DEFAULT 1 AFTER AvailableSpots;


CREATE TABLE communications (
    CommunicationId BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL,
    MessageType ENUM('email','sms','push') NOT NULL,
    SentTo VARCHAR(255) NOT NULL,
    MessageBody TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SentTime DATETIME NOT NULL,                   
    Status ENUM('sent','failed','queued','skipped') DEFAULT 'sent',
    FOREIGN KEY (UserId) REFERENCES users(UserId)
);

-- Index for fast SMS daily limit checks
CREATE INDEX idx_sms_limit 
  ON communications (UserId, MessageType, SentTime);


CREATE TABLE notification_communications (
    NotificationId INT NOT NULL,
    CommunicationId BIGINT NOT NULL,
    PRIMARY KEY (NotificationId, CommunicationId),
    FOREIGN KEY (NotificationId) REFERENCES notifications(NotificationId),
    FOREIGN KEY (CommunicationId) REFERENCES communications(CommunicationId)
);


ALTER TABLE users
  ADD COLUMN ForcePasswordChange TINYINT(1) NOT NULL DEFAULT 0;


-- CREATE TABLE app_usage (
--   UsageId      BIGINT NOT NULL AUTO_INCREMENT,
--   UserId       INT NOT NULL,
--   Platform     ENUM('iOS','Web') NOT NULL,
--   AppVersion   VARCHAR(32) NULL,
--   DeviceModel  VARCHAR(64) NULL,
--   DeviceIdHash VARCHAR(128) NULL,
--   OccurredAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (UsageId),
--   KEY idx_usage_user_time (UserId, OccurredAt),
--   KEY idx_usage_platform_time (Platform, OccurredAt),
--   CONSTRAINT fk_usage_user FOREIGN KEY (UserId) REFERENCES users(UserId)
-- );

