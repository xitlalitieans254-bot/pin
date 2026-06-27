package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

@Data
public class PrivacySettingsResponse {

    private Boolean resumeVisible;

    private Boolean searchableByBoss;

    private Boolean hidePhone;

    private Boolean hideWechat;

    private Boolean allowChat;

    private Boolean hideFromCurrentCompany;
}
