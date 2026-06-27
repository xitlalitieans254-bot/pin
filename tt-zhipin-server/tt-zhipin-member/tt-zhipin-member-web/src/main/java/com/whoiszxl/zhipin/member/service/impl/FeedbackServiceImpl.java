package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.FeedbackSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberFeedback;
import com.whoiszxl.zhipin.member.mapper.MemberFeedbackMapper;
import com.whoiszxl.zhipin.member.service.IFeedbackService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl extends ServiceImpl<MemberFeedbackMapper, MemberFeedback> implements IFeedbackService {

    private static final int PENDING_STATUS = 1;

    private final TokenHelper tokenHelper;

    @Override
    public SubmitResultResponse submit(FeedbackSubmitCommand command) {
        Assert.notNull(command, "feedback content is required");
        String content = StrUtil.trimToEmpty(command.getContent());
        Assert.isTrue(StrUtil.isNotBlank(content), "feedback content is required");

        MemberFeedback feedback = new MemberFeedback();
        feedback.setMemberId(tokenHelper.getAppMemberId());
        feedback.setFeedbackType(StrUtil.trimToEmpty(command.getFeedbackType()));
        feedback.setContent(content);
        feedback.setContact(StrUtil.trimToEmpty(command.getContact()));
        feedback.setEvidenceUrls(JSONUtil.toJsonStr(command.getEvidenceUrls() == null ? Collections.emptyList() : command.getEvidenceUrls()));
        feedback.setStatus(PENDING_STATUS);
        boolean saved = this.save(feedback);
        return new SubmitResultResponse(saved ? feedback.getId() : null, feedback.getStatus());
    }
}
