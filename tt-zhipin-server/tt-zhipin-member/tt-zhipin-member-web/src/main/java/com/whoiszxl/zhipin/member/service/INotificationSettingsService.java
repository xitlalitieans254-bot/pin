package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.NotificationSettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.NotificationSettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberNotificationSettings;

public interface INotificationSettingsService extends IService<MemberNotificationSettings> {

    NotificationSettingsResponse current();

    NotificationSettingsResponse saveCurrent(NotificationSettingsSaveCommand command);
}
