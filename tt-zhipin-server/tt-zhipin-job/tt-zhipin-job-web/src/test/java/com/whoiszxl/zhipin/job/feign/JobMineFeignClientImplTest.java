package com.whoiszxl.zhipin.job.feign;

import com.whoiszxl.zhipin.job.cqrs.response.BossMineJobOverviewResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.job.service.IJobService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobMineFeignClientImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private ICompanyService companyService;

    @Mock
    private IJobService jobService;

    @InjectMocks
    private JobMineFeignClientImpl jobMineFeignClient;

    @Test
    void bossMineOverviewReturnsCompanyAndJobCounts() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);

        Company company = new Company();
        company.setId(10L);
        company.setCompanyFullName("AI Zhipin Technology");
        company.setCompanyAbbrName("AI Zhipin");
        company.setCompanyLogo("https://example.com/logo.png");
        company.setIndustry("AI");
        company.setCompanyScale("1-20");
        when(companyService.getOne(any())).thenReturn(company);
        when(jobService.count(any())).thenReturn(3L, 1L);

        ResponseResult<BossMineJobOverviewResponse> result = jobMineFeignClient.bossMineOverview();

        assertThat(result.isOk()).isTrue();
        assertThat(result.getData().getCompanyId()).isEqualTo(10L);
        assertThat(result.getData().getCompanyFullName()).isEqualTo("AI Zhipin Technology");
        assertThat(result.getData().getCompanyProfileCompleted()).isTrue();
        assertThat(result.getData().getCompanyVerified()).isTrue();
        assertThat(result.getData().getOnlineJobCount()).isEqualTo(3);
        assertThat(result.getData().getOfflineJobCount()).isEqualTo(1);
        assertThat(result.getData().getLicenseSubmitted()).isTrue();
        assertThat(result.getData().getLicenseAuditStatus()).isEqualTo(1);
    }
}
