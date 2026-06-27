package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

@Data
public class NotificationSettingsResponse {

    private Boolean messageNotify;

    private Boolean jobRecommendNotify;

    private Boolean resumeViewNotify;

    private Boolean candidateNotify;
}
