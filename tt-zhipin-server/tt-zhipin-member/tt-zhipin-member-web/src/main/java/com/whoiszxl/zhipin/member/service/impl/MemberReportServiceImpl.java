package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.ReportSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberReport;
import com.whoiszxl.zhipin.member.mapper.MemberReportMapper;
import com.whoiszxl.zhipin.member.service.IMemberReportService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberReportServiceImpl extends ServiceImpl<MemberReportMapper, MemberReport> implements IMemberReportService {

    private static final int PENDING_STATUS = 1;
    private static final List<String> SUPPORTED_TARGET_TYPES = Arrays.asList("job", "company", "member", "message");

    private final TokenHelper tokenHelper;

    @Override
    public SubmitResultResponse submit(ReportSubmitCommand command) {
        Assert.notNull(command, "report target is required");
        String targetType = StrUtil.trimToEmpty(command.getTargetType()).toLowerCase();
        Assert.isTrue(SUPPORTED_TARGET_TYPES.contains(targetType), "targetType must be job, company, member or message");
        Assert.notNull(command.getTargetId(), "targetId is required");
        String reason = StrUtil.trimToEmpty(command.getReason());
        Assert.isTrue(StrUtil.isNotBlank(reason), "reason is required");

        MemberReport report = new MemberReport();
        report.setMemberId(tokenHelper.getAppMemberId());
        report.setTargetType(targetType);
        report.setTargetId(command.getTargetId());
        report.setReason(reason);
        report.setDescription(StrUtil.trimToEmpty(command.getDescription()));
        report.setEvidenceUrls(JSONUtil.toJsonStr(command.getEvidenceUrls() == null ? Collections.emptyList() : command.getEvidenceUrls()));
        report.setStatus(PENDING_STATUS);
        boolean saved = this.save(report);
        return new SubmitResultResponse(saved ? report.getId() : null, report.getStatus());
    }
}
