package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

@Data
public class NotificationSettingsSaveCommand {

    private Boolean messageNotify;

    private Boolean jobRecommendNotify;

    private Boolean resumeViewNotify;

    private Boolean candidateNotify;
}
