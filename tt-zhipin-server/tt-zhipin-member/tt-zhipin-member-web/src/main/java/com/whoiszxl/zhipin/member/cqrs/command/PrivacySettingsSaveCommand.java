package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

@Data
public class PrivacySettingsSaveCommand {

    private Boolean resumeVisible;

    private Boolean searchableByBoss;

    private Boolean hidePhone;

    private Boolean hideWechat;

    private Boolean allowChat;

    private Boolean hideFromCurrentCompany;
}
