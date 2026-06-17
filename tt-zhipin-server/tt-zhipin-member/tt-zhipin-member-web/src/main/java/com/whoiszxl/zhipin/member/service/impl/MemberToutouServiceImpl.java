package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.ToutouSubmitCommand;
import com.whoiszxl.zhipin.member.entity.MemberToutou;
import com.whoiszxl.zhipin.member.mapper.MemberToutouMapper;
import com.whoiszxl.zhipin.member.service.IMemberToutouService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberToutouServiceImpl extends ServiceImpl<MemberToutouMapper, MemberToutou> implements IMemberToutouService {

    private static final int ENABLED_STATUS = 1;
    private static final long INIT_VERSION = 1L;
    private static final int NOT_DELETED = 0;

    private final MemberToutouMapper memberToutouMapper;

    private final TokenHelper tokenHelper;

    @Override
    public void toutouSubmit(ToutouSubmitCommand toutouSubmitCommand) {
        Long memberId = tokenHelper.getAppMemberId();
        MemberToutou memberToutou = memberToutouMapper
                .selectOne(Wrappers.<MemberToutou>lambdaQuery().eq(MemberToutou::getMemberId, memberId));

        if(memberToutou != null) {
            MemberToutou updateToutou = new MemberToutou();
            updateToutou.setBusinessLicense(StrUtil.trim(toutouSubmitCommand.getBusinessLicense()));
            memberToutouMapper.update(updateToutou, Wrappers.<MemberToutou>lambdaQuery()
                    .eq(MemberToutou::getMemberId, memberId));
            return;
        }

        MemberToutou toutou = new MemberToutou();
        toutou.setMemberId(memberId);
        toutou.setBusinessLicense(StrUtil.trim(toutouSubmitCommand.getBusinessLicense()));
        toutou.setStatus(ENABLED_STATUS);
        toutou.setVersion(INIT_VERSION);
        toutou.setIsDeleted(NOT_DELETED);
        memberToutouMapper.insert(toutou);
    }
}
