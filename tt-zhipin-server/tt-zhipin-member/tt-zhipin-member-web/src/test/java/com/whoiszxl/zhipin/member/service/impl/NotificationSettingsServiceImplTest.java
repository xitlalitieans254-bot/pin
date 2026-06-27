package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.member.cqrs.command.NotificationSettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.NotificationSettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberNotificationSettings;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationSettingsServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private NotificationSettingsServiceImpl notificationSettingsService;

    @Test
    void currentReturnsDefaultSettingsWhenNoRecordExists() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(notificationSettingsService).getById(123L);

        NotificationSettingsResponse response = notificationSettingsService.current();

        assertThat(response.getMessageNotify()).isTrue();
        assertThat(response.getJobRecommendNotify()).isTrue();
        assertThat(response.getResumeViewNotify()).isTrue();
        assertThat(response.getCandidateNotify()).isTrue();
    }

    @Test
    void saveCurrentPersistsPartialCommandWithDefaults() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(notificationSettingsService).getById(123L);
        doReturn(true).when(notificationSettingsService).save(any(MemberNotificationSettings.class));

        NotificationSettingsSaveCommand command = new NotificationSettingsSaveCommand();
        command.setMessageNotify(false);

        NotificationSettingsResponse response = notificationSettingsService.saveCurrent(command);

        assertThat(response.getMessageNotify()).isFalse();
        assertThat(response.getJobRecommendNotify()).isTrue();

        ArgumentCaptor<MemberNotificationSettings> captor = ArgumentCaptor.forClass(MemberNotificationSettings.class);
        verify(notificationSettingsService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getMessageNotify()).isFalse();
        assertThat(captor.getValue().getJobRecommendNotify()).isTrue();
    }
}
