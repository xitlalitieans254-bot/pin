package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.ReportSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberReport;

public interface IMemberReportService extends IService<MemberReport> {

    SubmitResultResponse submit(ReportSubmitCommand command);
}
