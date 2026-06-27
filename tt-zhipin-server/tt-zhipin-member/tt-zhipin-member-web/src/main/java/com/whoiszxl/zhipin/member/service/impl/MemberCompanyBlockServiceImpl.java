package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.CompanyBlockCommand;
import com.whoiszxl.zhipin.member.cqrs.response.CompanyBlockResponse;
import com.whoiszxl.zhipin.member.entity.MemberCompanyBlock;
import com.whoiszxl.zhipin.member.mapper.MemberCompanyBlockMapper;
import com.whoiszxl.zhipin.member.service.IMemberCompanyBlockService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberCompanyBlockServiceImpl extends ServiceImpl<MemberCompanyBlockMapper, MemberCompanyBlock>
        implements IMemberCompanyBlockService {

    private static final int ENABLED_STATUS = 1;
    private static final int DISABLED_STATUS = 0;

    private final TokenHelper tokenHelper;

    @Override
    public List<CompanyBlockResponse> listCurrent() {
        Long memberId = tokenHelper.getAppMemberId();
        return this.list(Wrappers.<MemberCompanyBlock>lambdaQuery()
                        .eq(MemberCompanyBlock::getMemberId, memberId)
                        .eq(MemberCompanyBlock::getStatus, ENABLED_STATUS)
                        .orderByDesc(MemberCompanyBlock::getCreatedAt)
                        .orderByDesc(MemberCompanyBlock::getId))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Boolean addCurrent(CompanyBlockCommand command) {
        Assert.notNull(command, "companyId is required");
        Assert.notNull(command.getCompanyId(), "companyId is required");
        Long memberId = tokenHelper.getAppMemberId();
        String companyName = StrUtil.trimToEmpty(command.getCompanyName());

        MemberCompanyBlock existing = this.getOne(Wrappers.<MemberCompanyBlock>lambdaQuery()
                .eq(MemberCompanyBlock::getMemberId, memberId)
                .eq(MemberCompanyBlock::getCompanyId, command.getCompanyId())
                .last("LIMIT 1"));
        if(existing != null) {
            return this.update(Wrappers.<MemberCompanyBlock>lambdaUpdate()
                    .set(MemberCompanyBlock::getCompanyName, companyName)
                    .set(MemberCompanyBlock::getStatus, ENABLED_STATUS)
                    .eq(MemberCompanyBlock::getMemberId, memberId)
                    .eq(MemberCompanyBlock::getCompanyId, command.getCompanyId()));
        }

        MemberCompanyBlock block = new MemberCompanyBlock();
        block.setMemberId(memberId);
        block.setCompanyId(command.getCompanyId());
        block.setCompanyName(companyName);
        block.setStatus(ENABLED_STATUS);
        return this.save(block);
    }

    @Override
    public Boolean deleteCurrent(CompanyBlockCommand command) {
        Assert.notNull(command, "companyId is required");
        Assert.notNull(command.getCompanyId(), "companyId is required");
        Long memberId = tokenHelper.getAppMemberId();
        this.update(Wrappers.<MemberCompanyBlock>lambdaUpdate()
                .set(MemberCompanyBlock::getStatus, DISABLED_STATUS)
                .eq(MemberCompanyBlock::getMemberId, memberId)
                .eq(MemberCompanyBlock::getCompanyId, command.getCompanyId()));
        return true;
    }

    private CompanyBlockResponse toResponse(MemberCompanyBlock block) {
        CompanyBlockResponse response = new CompanyBlockResponse();
        response.setId(block.getId());
        response.setCompanyId(block.getCompanyId());
        response.setCompanyName(block.getCompanyName());
        response.setCreatedAt(block.getCreatedAt());
        return response;
    }
}
