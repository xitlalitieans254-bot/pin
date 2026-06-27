package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.PrivacySettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.PrivacySettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberPrivacySettings;

public interface IPrivacySettingsService extends IService<MemberPrivacySettings> {

    PrivacySettingsResponse current();

    PrivacySettingsResponse saveCurrent(PrivacySettingsSaveCommand command);
}
