package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.member.cqrs.command.ReportSubmitCommand;
import com.whoiszxl.zhipin.member.entity.MemberReport;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberReportServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private MemberReportServiceImpl reportService;

    @Test
    void submitNormalizesTargetTypeAndSavesReport() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(true).when(reportService).save(any(MemberReport.class));

        ReportSubmitCommand command = new ReportSubmitCommand();
        command.setTargetType("JOB");
        command.setTargetId(456L);
        command.setReason("  fake job  ");
        command.setDescription("description");
        command.setEvidenceUrls(Collections.singletonList("https://example.com/report.png"));

        reportService.submit(command);

        ArgumentCaptor<MemberReport> captor = ArgumentCaptor.forClass(MemberReport.class);
        verify(reportService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getTargetType()).isEqualTo("job");
        assertThat(captor.getValue().getTargetId()).isEqualTo(456L);
        assertThat(captor.getValue().getReason()).isEqualTo("fake job");
        assertThat(captor.getValue().getEvidenceUrls()).contains("https://example.com/report.png");
    }

    @Test
    void submitRejectsUnsupportedTargetType() {
        ReportSubmitCommand command = new ReportSubmitCommand();
        command.setTargetType("other");
        command.setTargetId(456L);
        command.setReason("reason");

        assertThatThrownBy(() -> reportService.submit(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("targetType");
    }
}
