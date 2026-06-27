package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.member.cqrs.command.PrivacySettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.PrivacySettingsResponse;
import com.whoiszxl.zhipin.member.entity.MemberPrivacySettings;
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
class PrivacySettingsServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private PrivacySettingsServiceImpl privacySettingsService;

    @Test
    void currentReturnsDefaultSettingsWhenNoRecordExists() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(privacySettingsService).getById(123L);

        PrivacySettingsResponse response = privacySettingsService.current();

        assertThat(response.getResumeVisible()).isTrue();
        assertThat(response.getSearchableByBoss()).isTrue();
        assertThat(response.getHidePhone()).isTrue();
        assertThat(response.getHideWechat()).isTrue();
        assertThat(response.getAllowChat()).isTrue();
        assertThat(response.getHideFromCurrentCompany()).isFalse();
    }

    @Test
    void saveCurrentPersistsPartialCommandWithDefaults() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(privacySettingsService).getById(123L);
        doReturn(true).when(privacySettingsService).save(any(MemberPrivacySettings.class));

        PrivacySettingsSaveCommand command = new PrivacySettingsSaveCommand();
        command.setHidePhone(false);
        command.setAllowChat(false);

        PrivacySettingsResponse response = privacySettingsService.saveCurrent(command);

        assertThat(response.getHidePhone()).isFalse();
        assertThat(response.getAllowChat()).isFalse();
        assertThat(response.getResumeVisible()).isTrue();

        ArgumentCaptor<MemberPrivacySettings> captor = ArgumentCaptor.forClass(MemberPrivacySettings.class);
        verify(privacySettingsService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getHidePhone()).isFalse();
        assertThat(captor.getValue().getAllowChat()).isFalse();
    }
}
