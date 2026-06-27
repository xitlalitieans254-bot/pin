package com.whoiszxl.zhipin.member.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.AccountDeleteCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberAccountDeleteApply;
import com.whoiszxl.zhipin.member.mapper.MemberAccountDeleteApplyMapper;
import com.whoiszxl.zhipin.member.service.IMemberAccountDeleteApplyService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberAccountDeleteApplyServiceImpl extends ServiceImpl<MemberAccountDeleteApplyMapper, MemberAccountDeleteApply>
        implements IMemberAccountDeleteApplyService {

    private static final int PENDING_STATUS = 1;

    private final TokenHelper tokenHelper;

    @Override
    public Boolean logout() {
        StpUtil.logout();
        return true;
    }

    @Override
    public SubmitResultResponse applyDelete(AccountDeleteCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        MemberAccountDeleteApply existing = this.getOne(Wrappers.<MemberAccountDeleteApply>lambdaQuery()
                .eq(MemberAccountDeleteApply::getMemberId, memberId)
                .eq(MemberAccountDeleteApply::getStatus, PENDING_STATUS)
                .last("LIMIT 1"));
        if(existing != null) {
            return new SubmitResultResponse(existing.getId(), existing.getStatus());
        }

        MemberAccountDeleteApply apply = new MemberAccountDeleteApply();
        apply.setMemberId(memberId);
        apply.setReason(command == null ? "" : StrUtil.trimToEmpty(command.getReason()));
        apply.setStatus(PENDING_STATUS);
        boolean saved = this.save(apply);
        return new SubmitResultResponse(saved ? apply.getId() : null, apply.getStatus());
    }
}
