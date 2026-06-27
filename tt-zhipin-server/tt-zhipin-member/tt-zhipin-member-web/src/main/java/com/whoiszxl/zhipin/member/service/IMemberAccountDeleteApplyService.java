package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.AccountDeleteCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberAccountDeleteApply;

public interface IMemberAccountDeleteApplyService extends IService<MemberAccountDeleteApply> {

    Boolean logout();

    SubmitResultResponse applyDelete(AccountDeleteCommand command);
}
