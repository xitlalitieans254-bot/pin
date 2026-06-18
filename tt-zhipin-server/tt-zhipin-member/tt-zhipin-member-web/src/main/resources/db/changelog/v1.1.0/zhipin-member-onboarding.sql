CREATE TABLE IF NOT EXISTS `ums_member_onboarding`(
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `role`                              varchar(32) DEFAULT NULL COMMENT 'current selected role: JOBSEEKER/BOSS',
    `current_step`                      varchar(64) NOT NULL DEFAULT '' COMMENT 'current onboarding step key',
    `current_step_index`                int DEFAULT 0 COMMENT 'current onboarding step index',
    `jobseeker_draft`                   longtext COMMENT 'jobseeker onboarding draft json',
    `boss_draft`                        longtext COMMENT 'boss onboarding draft json',
    `jobseeker_completed`               tinyint(2) NOT NULL DEFAULT 0 COMMENT 'whether jobseeker onboarding completed',
    `boss_completed`                    tinyint(2) NOT NULL DEFAULT 0 COMMENT 'whether boss onboarding completed',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT 'status: 0 disabled, 1 enabled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock version',
    `is_deleted`                        tinyint(3) DEFAULT 0 COMMENT 'logic delete flag',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`member_id`),
    KEY `idx_role` (`role`),
    KEY `idx_updated_at` (`updated_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT 'member onboarding progress and draft';

ALTER TABLE `ums_member_exp`
    ADD COLUMN `skill_tags` varchar(1024) DEFAULT NULL COMMENT 'skill tags json array';
