-- liquibase formatted sql

-- changeset codex:member-settings-1
CREATE TABLE IF NOT EXISTS `ums_member_privacy_settings`(
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `resume_visible`                    tinyint(1) NOT NULL DEFAULT 1 COMMENT 'resume visible to boss',
    `searchable_by_boss`                tinyint(1) NOT NULL DEFAULT 1 COMMENT 'searchable by boss',
    `hide_phone`                        tinyint(1) NOT NULL DEFAULT 1 COMMENT 'hide phone number',
    `hide_wechat`                       tinyint(1) NOT NULL DEFAULT 1 COMMENT 'hide wechat',
    `allow_chat`                        tinyint(1) NOT NULL DEFAULT 1 COMMENT 'allow chat',
    `hide_from_current_company`         tinyint(1) NOT NULL DEFAULT 0 COMMENT 'hide from current company',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '0 disabled 1 enabled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`member_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member privacy settings';

CREATE TABLE IF NOT EXISTS `ums_member_notification_settings`(
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `message_notify`                    tinyint(1) NOT NULL DEFAULT 1 COMMENT 'message notification',
    `job_recommend_notify`              tinyint(1) NOT NULL DEFAULT 1 COMMENT 'job recommend notification',
    `resume_view_notify`                tinyint(1) NOT NULL DEFAULT 1 COMMENT 'resume view notification',
    `candidate_notify`                  tinyint(1) NOT NULL DEFAULT 1 COMMENT 'candidate notification',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '0 disabled 1 enabled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`member_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member notification settings';

CREATE TABLE IF NOT EXISTS `ums_member_company_block`(
    `id`                                bigint(11) NOT NULL COMMENT 'primary id',
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `company_id`                        bigint(11) NOT NULL COMMENT 'blocked company id',
    `company_name`                      varchar(128) NOT NULL DEFAULT '' COMMENT 'blocked company name',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '0 disabled 1 enabled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_member_company` (`member_id`, `company_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member blocked company';

CREATE TABLE IF NOT EXISTS `ums_member_account_delete_apply`(
    `id`                                bigint(11) NOT NULL COMMENT 'primary id',
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `reason`                            varchar(512) NOT NULL DEFAULT '' COMMENT 'delete reason',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '1 pending 2 approved 3 rejected 4 canceled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member account delete application';

CREATE TABLE IF NOT EXISTS `ums_member_feedback`(
    `id`                                bigint(11) NOT NULL COMMENT 'primary id',
    `member_id`                         bigint(11) NOT NULL COMMENT 'member id',
    `feedback_type`                     varchar(32) NOT NULL DEFAULT '' COMMENT 'feedback type',
    `content`                           varchar(1000) NOT NULL DEFAULT '' COMMENT 'feedback content',
    `contact`                           varchar(128) NOT NULL DEFAULT '' COMMENT 'contact',
    `evidence_urls`                     json DEFAULT NULL COMMENT 'evidence urls',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '1 pending 2 processed',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member feedback';

CREATE TABLE IF NOT EXISTS `ums_member_help`(
    `id`                                bigint(11) NOT NULL COMMENT 'primary id',
    `category`                          varchar(32) NOT NULL DEFAULT '' COMMENT 'category',
    `title`                             varchar(128) NOT NULL DEFAULT '' COMMENT 'title',
    `content`                           varchar(1000) NOT NULL DEFAULT '' COMMENT 'content',
    `sort`                              int NOT NULL DEFAULT 0 COMMENT 'sort',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '0 disabled 1 enabled',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`id`),
    KEY `idx_status_sort` (`status`, `sort`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member help center';

CREATE TABLE IF NOT EXISTS `ums_member_report`(
    `id`                                bigint(11) NOT NULL COMMENT 'primary id',
    `member_id`                         bigint(11) NOT NULL COMMENT 'reporter member id',
    `target_type`                       varchar(32) NOT NULL DEFAULT '' COMMENT 'job company member message',
    `target_id`                         bigint(11) NOT NULL COMMENT 'target id',
    `reason`                            varchar(128) NOT NULL DEFAULT '' COMMENT 'reason',
    `description`                       varchar(1000) NOT NULL DEFAULT '' COMMENT 'description',
    `evidence_urls`                     json DEFAULT NULL COMMENT 'evidence urls',
    `status`                            tinyint(2) NOT NULL DEFAULT 1 COMMENT '1 pending 2 processed 3 rejected',
    `version`                           bigint(11) unsigned NOT NULL DEFAULT '1' COMMENT 'optimistic lock',
    `is_deleted`                        tinyint(3) NOT NULL DEFAULT 0 COMMENT 'logical delete',
    `created_at`                        datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
    `updated_at`                        datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
    PRIMARY KEY (`id`),
    KEY `idx_member_id` (`member_id`),
    KEY `idx_target` (`target_type`, `target_id`)
) ENGINE = InnoDB CHARSET = utf8mb4 COMMENT 'member report';

INSERT IGNORE INTO `ums_member_help` (`id`, `category`, `title`, `content`, `sort`, `status`, `version`, `is_deleted`)
VALUES
    (1, 'account', '账号与登录', '如无法登录，请确认手机号和验证码是否正确；测试号可使用固定验证码。', 10, 1, 1, 0),
    (2, 'privacy', '隐私与屏蔽', '可在隐私设置中控制简历可见、联系方式隐藏、屏蔽公司等选项。', 20, 1, 1, 0),
    (3, 'job', '职位与沟通', '求职者可通过职位详情发起沟通，招聘方可在聊天中查看候选人信息。', 30, 1, 1, 0),
    (4, 'service', '反馈与客服', '遇到异常或体验问题，可提交反馈，平台会尽快处理。', 40, 1, 1, 0);
