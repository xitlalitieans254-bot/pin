package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.NotificationSettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.NotificationSettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberNotificationSettings;
import com.whoiszxl.zhipin.member.mapper.MemberNotificationSettingsMapper;
import com.whoiszxl.zhipin.member.service.INotificationSettingsService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationSettingsServiceImpl extends ServiceImpl<MemberNotificationSettingsMapper, MemberNotificationSettings>
        implements INotificationSettingsService {

    private static final int ENABLED_STATUS = 1;
    private static final int NOT_DELETED = 0;
    private static final long INIT_VERSION = 1L;

    private final TokenHelper tokenHelper;

    @Override
    public NotificationSettingsResponse current() {
        Long memberId = tokenHelper.getAppMemberId();
        MemberNotificationSettings settings = this.getById(memberId);
        return toResponse(settings == null ? defaultSettings(memberId) : settings);
    }

    @Override
    public NotificationSettingsResponse saveCurrent(NotificationSettingsSaveCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        MemberNotificationSettings existing = this.getById(memberId);
        MemberNotificationSettings settings = existing == null ? defaultSettings(memberId) : existing;
        if(command != null) {
            settings.setMessageNotify(defaultIfNull(command.getMessageNotify(), settings.getMessageNotify()));
            settings.setJobRecommendNotify(defaultIfNull(command.getJobRecommendNotify(), settings.getJobRecommendNotify()));
            settings.setResumeViewNotify(defaultIfNull(command.getResumeViewNotify(), settings.getResumeViewNotify()));
            settings.setCandidateNotify(defaultIfNull(command.getCandidateNotify(), settings.getCandidateNotify()));
        }
        settings.setStatus(ENABLED_STATUS);
        if(existing == null) {
            this.save(settings);
        } else {
            this.update(settings, Wrappers.<MemberNotificationSettings>lambdaQuery()
                    .eq(MemberNotificationSettings::getMemberId, memberId));
        }
        return toResponse(settings);
    }

    private MemberNotificationSettings defaultSettings(Long memberId) {
        MemberNotificationSettings settings = new MemberNotificationSettings();
        settings.setMemberId(memberId);
        settings.setMessageNotify(true);
        settings.setJobRecommendNotify(true);
        settings.setResumeViewNotify(true);
        settings.setCandidateNotify(true);
        settings.setStatus(ENABLED_STATUS);
        settings.setVersion(INIT_VERSION);
        settings.setIsDeleted(NOT_DELETED);
        return settings;
    }

    private NotificationSettingsResponse toResponse(MemberNotificationSettings settings) {
        NotificationSettingsResponse response = new NotificationSettingsResponse();
        response.setMessageNotify(defaultIfNull(settings.getMessageNotify(), true));
        response.setJobRecommendNotify(defaultIfNull(settings.getJobRecommendNotify(), true));
        response.setResumeViewNotify(defaultIfNull(settings.getResumeViewNotify(), true));
        response.setCandidateNotify(defaultIfNull(settings.getCandidateNotify(), true));
        return response;
    }

    private Boolean defaultIfNull(Boolean value, Boolean defaultValue) {
        return value == null ? defaultValue : value;
    }
}
