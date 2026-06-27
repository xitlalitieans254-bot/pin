package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.member.cqrs.command.FeedbackSubmitCommand;
import com.whoiszxl.zhipin.member.entity.MemberFeedback;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private FeedbackServiceImpl feedbackService;

    @Test
    void submitSavesFeedbackForCurrentMember() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(true).when(feedbackService).save(any(MemberFeedback.class));

        FeedbackSubmitCommand command = new FeedbackSubmitCommand();
        command.setFeedbackType("bug");
        command.setContent("  page error  ");
        command.setContact("wechat");
        command.setEvidenceUrls(Collections.singletonList("https://example.com/a.png"));

        feedbackService.submit(command);

        ArgumentCaptor<MemberFeedback> captor = ArgumentCaptor.forClass(MemberFeedback.class);
        verify(feedbackService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getContent()).isEqualTo("page error");
        assertThat(captor.getValue().getEvidenceUrls()).contains("https://example.com/a.png");
        assertThat(captor.getValue().getStatus()).isEqualTo(1);
    }
}
