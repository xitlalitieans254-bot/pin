package com.whoiszxl.zhipin.job.feign;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.job.cqrs.response.BossMineJobOverviewResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.entity.Job;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.job.service.IJobService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class JobMineFeignClientImpl implements JobMineFeignClient {

    private static final int ONLINE_STATUS = 1;
    private static final int OFFLINE_STATUS = 0;
    private static final int LICENSE_STATUS_NOT_SUBMITTED = 0;
    private static final int LICENSE_STATUS_APPROVED = 1;

    private final TokenHelper tokenHelper;
    private final ICompanyService companyService;
    private final IJobService jobService;

    @Override
    public ResponseResult<BossMineJobOverviewResponse> bossMineOverview() {
        Long memberId = tokenHelper.getAppMemberId();
        BossMineJobOverviewResponse response = new BossMineJobOverviewResponse();

        Company company = currentCompany(memberId);
        if(company != null) {
            fillCompany(response, company);
        }

        response.setOnlineJobCount(toInt(jobService.count(Wrappers.<Job>lambdaQuery()
                .eq(Job::getMemberId, memberId)
                .eq(Job::getStatus, ONLINE_STATUS))));
        response.setOfflineJobCount(toInt(jobService.count(Wrappers.<Job>lambdaQuery()
                .eq(Job::getMemberId, memberId)
                .eq(Job::getStatus, OFFLINE_STATUS))));
        return ResponseResult.buildSuccess(response);
    }

    private Company currentCompany(Long memberId) {
        if(memberId == null) {
            return null;
        }
        return companyService.getOne(Wrappers.<Company>lambdaQuery()
                .eq(Company::getApplyMemberId, memberId)
                .last("LIMIT 1"));
    }

    private void fillCompany(BossMineJobOverviewResponse response, Company company) {
        response.setCompanyId(company.getId());
        response.setCompanyFullName(StrUtil.nullToEmpty(company.getCompanyFullName()));
        response.setCompanyAbbrName(StrUtil.nullToEmpty(company.getCompanyAbbrName()));
        response.setCompanyLogo(StrUtil.nullToEmpty(company.getCompanyLogo()));
        boolean profileCompleted = StrUtil.isNotBlank(company.getCompanyFullName())
                && StrUtil.isNotBlank(company.getCompanyAbbrName())
                && StrUtil.isNotBlank(company.getIndustry())
                && StrUtil.isNotBlank(company.getCompanyScale());
        response.setCompanyProfileCompleted(profileCompleted);
        response.setCompanyVerified(profileCompleted);
        response.setLicenseSubmitted(profileCompleted);
        response.setLicenseAuditStatus(profileCompleted ? LICENSE_STATUS_APPROVED : LICENSE_STATUS_NOT_SUBMITTED);
        response.setLicenseAuditText(profileCompleted ? "\u5df2\u8ba4\u8bc1" : "\u672a\u63d0\u4ea4");
    }

    private Integer toInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }
}
