package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.PrivacySettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.PrivacySettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberPrivacySettings;
import com.whoiszxl.zhipin.member.mapper.MemberPrivacySettingsMapper;
import com.whoiszxl.zhipin.member.service.IPrivacySettingsService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PrivacySettingsServiceImpl extends ServiceImpl<MemberPrivacySettingsMapper, MemberPrivacySettings>
        implements IPrivacySettingsService {

    private static final int ENABLED_STATUS = 1;
    private static final int NOT_DELETED = 0;
    private static final long INIT_VERSION = 1L;

    private final TokenHelper tokenHelper;

    @Override
    public PrivacySettingsResponse current() {
        Long memberId = tokenHelper.getAppMemberId();
        MemberPrivacySettings settings = this.getById(memberId);
        return toResponse(settings == null ? defaultSettings(memberId) : settings);
    }

    @Override
    public PrivacySettingsResponse saveCurrent(PrivacySettingsSaveCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        MemberPrivacySettings existing = this.getById(memberId);
        MemberPrivacySettings settings = existing == null ? defaultSettings(memberId) : existing;
        if(command != null) {
            settings.setResumeVisible(defaultIfNull(command.getResumeVisible(), settings.getResumeVisible()));
            settings.setSearchableByBoss(defaultIfNull(command.getSearchableByBoss(), settings.getSearchableByBoss()));
            settings.setHidePhone(defaultIfNull(command.getHidePhone(), settings.getHidePhone()));
            settings.setHideWechat(defaultIfNull(command.getHideWechat(), settings.getHideWechat()));
            settings.setAllowChat(defaultIfNull(command.getAllowChat(), settings.getAllowChat()));
            settings.setHideFromCurrentCompany(defaultIfNull(command.getHideFromCurrentCompany(), settings.getHideFromCurrentCompany()));
        }
        settings.setStatus(ENABLED_STATUS);
        if(existing == null) {
            this.save(settings);
        } else {
            this.update(settings, Wrappers.<MemberPrivacySettings>lambdaQuery()
                    .eq(MemberPrivacySettings::getMemberId, memberId));
        }
        return toResponse(settings);
    }

    private MemberPrivacySettings defaultSettings(Long memberId) {
        MemberPrivacySettings settings = new MemberPrivacySettings();
        settings.setMemberId(memberId);
        settings.setResumeVisible(true);
        settings.setSearchableByBoss(true);
        settings.setHidePhone(true);
        settings.setHideWechat(true);
        settings.setAllowChat(true);
        settings.setHideFromCurrentCompany(false);
        settings.setStatus(ENABLED_STATUS);
        settings.setVersion(INIT_VERSION);
        settings.setIsDeleted(NOT_DELETED);
        return settings;
    }

    private PrivacySettingsResponse toResponse(MemberPrivacySettings settings) {
        PrivacySettingsResponse response = new PrivacySettingsResponse();
        response.setResumeVisible(defaultIfNull(settings.getResumeVisible(), true));
        response.setSearchableByBoss(defaultIfNull(settings.getSearchableByBoss(), true));
        response.setHidePhone(defaultIfNull(settings.getHidePhone(), true));
        response.setHideWechat(defaultIfNull(settings.getHideWechat(), true));
        response.setAllowChat(defaultIfNull(settings.getAllowChat(), true));
        response.setHideFromCurrentCompany(defaultIfNull(settings.getHideFromCurrentCompany(), false));
        return response;
    }

    private Boolean defaultIfNull(Boolean value, Boolean defaultValue) {
        return value == null ? defaultValue : value;
    }
}
