package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.AttachmentResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.ResumeNameUpdateCommand;
import com.whoiszxl.zhipin.member.entity.MemberAttachmentResume;
import com.whoiszxl.zhipin.member.mapper.MemberAttachmentResumeMapper;
import com.whoiszxl.zhipin.member.service.IMemberAttachmentResumeService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberAttachmentResumeServiceImpl extends ServiceImpl<MemberAttachmentResumeMapper, MemberAttachmentResume> implements IMemberAttachmentResumeService {

    private static final int MAX_ATTACHMENT_RESUME_COUNT = 3;

    private final TokenHelper tokenHelper;

    @Override
    public Boolean saveResume(AttachmentResumeSaveCommand saveCommand) {
        Long memberId = tokenHelper.getAppMemberId();
        String filename = StrUtil.trim(saveCommand.getFilename());
        String url = StrUtil.trim(saveCommand.getUrl());

        Assert.isTrue(StrUtil.isNotBlank(filename), "文件名不能为空");
        Assert.isTrue(StrUtil.isNotBlank(url), "文件地址不能为空");

        MemberAttachmentResume existingResume = this.getOne(Wrappers.<MemberAttachmentResume>lambdaQuery()
                .eq(MemberAttachmentResume::getMemberId, memberId)
                .eq(MemberAttachmentResume::getUrl, url)
                .last("LIMIT 1"));
        if(existingResume != null) {
            return this.update(Wrappers.<MemberAttachmentResume>lambdaUpdate()
                    .set(MemberAttachmentResume::getFilename, filename)
                    .eq(MemberAttachmentResume::getMemberId, memberId)
                    .eq(MemberAttachmentResume::getId, existingResume.getId()));
        }

        long count = this.count(Wrappers.<MemberAttachmentResume>lambdaQuery()
                .eq(MemberAttachmentResume::getMemberId, memberId));
        Assert.isTrue(count < MAX_ATTACHMENT_RESUME_COUNT, "超过了附件简历数量上限");

        MemberAttachmentResume memberAttachmentResume = new MemberAttachmentResume();
        memberAttachmentResume.setMemberId(memberId);
        memberAttachmentResume.setFilename(filename);
        memberAttachmentResume.setUrl(url);

        return this.save(memberAttachmentResume);
    }

    @Override
    public List<MemberAttachmentResume> listCurrentMemberResumes() {
        return this.list(Wrappers.<MemberAttachmentResume>lambdaQuery()
                .eq(MemberAttachmentResume::getMemberId, tokenHelper.getAppMemberId())
                .orderByDesc(MemberAttachmentResume::getCreatedAt)
                .orderByDesc(MemberAttachmentResume::getId));
    }

    @Override
    public Boolean deleteResume(String id) {
        String resumeId = StrUtil.trim(id);
        Assert.isTrue(StrUtil.isNotBlank(resumeId), "附件简历id不能为空");

        return this.remove(Wrappers.<MemberAttachmentResume>lambdaQuery()
                .eq(MemberAttachmentResume::getMemberId, tokenHelper.getAppMemberId())
                .eq(MemberAttachmentResume::getId, resumeId));
    }

    @Override
    public Boolean updateResumeName(ResumeNameUpdateCommand updateCommand) {
        String resumeId = StrUtil.trim(updateCommand.getId());
        String filename = StrUtil.trim(updateCommand.getNewFilename());

        Assert.isTrue(StrUtil.isNotBlank(resumeId), "附件简历id不能为空");
        Assert.isTrue(StrUtil.isNotBlank(filename), "附件简历名称不能为空");

        return this.update(Wrappers.<MemberAttachmentResume>lambdaUpdate()
                .set(MemberAttachmentResume::getFilename, filename)
                .eq(MemberAttachmentResume::getMemberId, tokenHelper.getAppMemberId())
                .eq(MemberAttachmentResume::getId, resumeId));
    }
}
