package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.FeedbackSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberFeedback;

public interface IFeedbackService extends IService<MemberFeedback> {

    SubmitResultResponse submit(FeedbackSubmitCommand command);
}
