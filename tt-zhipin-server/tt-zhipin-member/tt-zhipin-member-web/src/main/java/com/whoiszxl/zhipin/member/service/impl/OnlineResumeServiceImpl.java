package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeBaseSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.ResumeVisibilityCommand;
import com.whoiszxl.zhipin.member.cqrs.dto.EduExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.ProjectExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.response.BossMemberResumeDetailResponse;
import com.whoiszxl.zhipin.member.cqrs.response.MemberInfoResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnlineResumeResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeVisibilityResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.member.service.IOnlineResumeService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OnlineResumeServiceImpl implements IOnlineResumeService {

    private static final int ENABLED = 1;
    private static final int DISABLED = 0;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");

    private final TokenHelper tokenHelper;
    private final IMemberService memberService;
    private final IMemberExpService memberExpService;

    @Override
    public OnlineResumeResponse info() {
        Long memberId = tokenHelper.getAppMemberId();
        return buildResponse(memberId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean save(OnlineResumeSaveCommand saveCommand) {
        Long memberId = tokenHelper.getAppMemberId();
        boolean baseSaved = saveBaseInternal(memberId, saveCommand);
        if(!hasResumeSection(saveCommand)) {
            return baseSaved;
        }
        return saveResumeSections(memberId, saveCommand);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean saveBase(OnlineResumeBaseSaveCommand saveCommand) {
        Long memberId = tokenHelper.getAppMemberId();
        return saveBaseInternal(memberId, saveCommand);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ResumeVisibilityResponse updateVisibility(ResumeVisibilityCommand command) {
        Assert.notNull(command, "visibility command is required");
        Assert.notNull(command.getVisible(), "visible is required");
        Long memberId = tokenHelper.getAppMemberId();
        MemberExp currentMemberExp = getMemberExp(memberId);
        MemberExp updateMemberExp = new MemberExp();
        updateMemberExp.setMemberId(memberId);
        updateMemberExp.setStatus(Boolean.TRUE.equals(command.getVisible()) ? ENABLED : DISABLED);

        boolean saved = currentMemberExp == null
                ? memberExpService.save(updateMemberExp)
                : memberExpService.update(updateMemberExp, Wrappers.<MemberExp>lambdaUpdate()
                        .eq(MemberExp::getMemberId, memberId));
        Assert.isTrue(saved, "resume visibility save failed");
        return new ResumeVisibilityResponse(command.getVisible());
    }

    @Override
    public BossMemberResumeDetailResponse bossDetail(Long memberId) {
        Assert.notNull(memberId, "memberId is required");
        Member member = memberService.getById(memberId);
        Assert.notNull(member, "member does not exist");

        OnlineResumeResponse resumeResponse = buildResponse(memberId, member, getMemberExp(memberId));
        BossMemberResumeDetailResponse response = BeanUtil.copyProperties(resumeResponse, BossMemberResumeDetailResponse.class);
        response.setCanChat(Boolean.TRUE.equals(resumeResponse.getVisible()));
        response.setLastActiveTime(member.getLastLogin());
        return response;
    }

    private OnlineResumeResponse buildResponse(Long memberId) {
        Member member = memberService.getById(memberId);
        Assert.notNull(member, "member does not exist");
        return buildResponse(memberId, member, getMemberExp(memberId));
    }

    private OnlineResumeResponse buildResponse(Long memberId, Member member, MemberExp memberExp) {
        OnlineResumeResponse response = new OnlineResumeResponse();
        response.setMemberId(memberId);
        MemberInfoResponse memberInfoResponse = BeanUtil.copyProperties(member, MemberInfoResponse.class);
        memberInfoResponse.setPassword(null);
        memberInfoResponse.setToken(null);
        response.setMemberInfoResponse(memberInfoResponse);
        response.setAvatar(StringUtils.defaultString(member.getAvatar()));
        response.setFullName(StringUtils.defaultString(member.getFullName()));
        response.setGender(member.getGender());
        response.setBirthday(formatDate(member.getBirthday()));
        response.setCity(StringUtils.defaultString(member.getCity()));
        response.setWorkStatus(member.getWorkStatus());
        response.setWorkDate(formatDate(member.getWorkDate()));
        response.setHighestQualification(member.getHighestQualification());
        response.setHighestQualificationType(member.getHighestQualificationType());

        if(memberExp == null) {
            response.setVisible(true);
            return response;
        }

        response.setVisible(!Integer.valueOf(DISABLED).equals(memberExp.getStatus()));
        response.setWorkExpectDtoList(normalizeWorkExpectList(jsonList(memberExp.getWorkExpect(), WorkExpectDto.class)));
        response.setWorkExperienceDtoList(normalizeWorkExperienceList(jsonList(memberExp.getWorkExperience(), WorkExperienceDto.class)));
        response.setProjectExperienceDtoList(normalizeProjectExperienceList(jsonList(memberExp.getProjectExperience(), ProjectExperienceDto.class)));
        response.setEduExperienceDtoList(jsonList(memberExp.getEduExperience(), EduExperienceDto.class));
        response.setQualificationList(jsonList(memberExp.getQualification(), String.class));
        response.setSkillTagList(jsonList(memberExp.getSkillTags(), String.class));
        response.setAdvantage(StringUtils.defaultString(memberExp.getAdvantage()));
        return response;
    }

    private boolean saveBaseInternal(Long memberId, OnlineResumeBaseSaveCommand saveCommand) {
        if(saveCommand == null || !hasBaseField(saveCommand)) {
            return true;
        }
        Member updateMember = new Member();
        updateMember.setId(memberId);
        if(saveCommand.getFullName() != null) {
            updateMember.setFullName(StringUtils.trimToEmpty(saveCommand.getFullName()));
        }
        if(saveCommand.getGender() != null) {
            updateMember.setGender(saveCommand.getGender());
        }
        if(saveCommand.getBirthday() != null) {
            updateMember.setBirthday(parseDate(saveCommand.getBirthday()));
        }
        if(saveCommand.getAvatar() != null) {
            updateMember.setAvatar(StringUtils.trimToEmpty(saveCommand.getAvatar()));
        }
        if(saveCommand.getCity() != null) {
            updateMember.setCity(StringUtils.trimToEmpty(saveCommand.getCity()));
        }
        if(saveCommand.getWorkStatus() != null) {
            updateMember.setWorkStatus(saveCommand.getWorkStatus());
        }
        if(saveCommand.getWorkDate() != null) {
            updateMember.setWorkDate(parseDate(saveCommand.getWorkDate()));
        }
        if(saveCommand.getHighestQualification() != null) {
            updateMember.setHighestQualification(saveCommand.getHighestQualification());
        }
        if(saveCommand.getHighestQualificationType() != null) {
            updateMember.setHighestQualificationType(saveCommand.getHighestQualificationType());
        }
        boolean updated = memberService.updateById(updateMember);
        Assert.isTrue(updated, "resume base save failed");
        refreshLoginMember(updateMember);
        return true;
    }

    private boolean saveResumeSections(Long memberId, OnlineResumeSaveCommand saveCommand) {
        MemberExp updateMemberExp = new MemberExp();
        updateMemberExp.setMemberId(memberId);

        if(saveCommand.getAdvantage() != null) {
            updateMemberExp.setAdvantage(saveCommand.getAdvantage());
        }
        if(saveCommand.getWorkExpectDtoList() != null) {
            updateMemberExp.setWorkExpect(JSONUtil.toJsonStr(normalizeWorkExpectList(saveCommand.getWorkExpectDtoList())));
        }
        if(saveCommand.getWorkExperienceDtoList() != null) {
            updateMemberExp.setWorkExperience(JSONUtil.toJsonStr(normalizeWorkExperienceList(saveCommand.getWorkExperienceDtoList())));
        }
        if(saveCommand.getProjectExperienceDtoList() != null) {
            updateMemberExp.setProjectExperience(JSONUtil.toJsonStr(normalizeProjectExperienceList(saveCommand.getProjectExperienceDtoList())));
        }
        if(saveCommand.getEduExperienceDtoList() != null) {
            updateMemberExp.setEduExperience(JSONUtil.toJsonStr(saveCommand.getEduExperienceDtoList()));
        }
        if(saveCommand.getQualificationList() != null) {
            updateMemberExp.setQualification(JSONUtil.toJsonStr(saveCommand.getQualificationList()));
        }
        if(saveCommand.getSkillTagList() != null) {
            updateMemberExp.setSkillTags(JSONUtil.toJsonStr(saveCommand.getSkillTagList()));
        }

        MemberExp currentMemberExp = getMemberExp(memberId);
        if(currentMemberExp == null) {
            updateMemberExp.setStatus(ENABLED);
            return memberExpService.save(updateMemberExp);
        }

        return memberExpService.update(updateMemberExp, Wrappers.<MemberExp>lambdaUpdate()
                .eq(MemberExp::getMemberId, memberId));
    }

    private boolean hasBaseField(OnlineResumeBaseSaveCommand saveCommand) {
        return saveCommand.getFullName() != null
                || saveCommand.getGender() != null
                || saveCommand.getBirthday() != null
                || saveCommand.getAvatar() != null
                || saveCommand.getCity() != null
                || saveCommand.getWorkStatus() != null
                || saveCommand.getWorkDate() != null
                || saveCommand.getHighestQualification() != null
                || saveCommand.getHighestQualificationType() != null;
    }

    private boolean hasResumeSection(OnlineResumeSaveCommand saveCommand) {
        return saveCommand != null && (saveCommand.getAdvantage() != null
                || saveCommand.getWorkExpectDtoList() != null
                || saveCommand.getWorkExperienceDtoList() != null
                || saveCommand.getProjectExperienceDtoList() != null
                || saveCommand.getEduExperienceDtoList() != null
                || saveCommand.getQualificationList() != null
                || saveCommand.getSkillTagList() != null);
    }

    private MemberExp getMemberExp(Long memberId) {
        return memberExpService.getOne(Wrappers.<MemberExp>lambdaQuery()
                .eq(MemberExp::getMemberId, memberId)
                .last("LIMIT 1"));
    }

    private <T> List<T> jsonList(String json, Class<T> targetClass) {
        if(StringUtils.isBlank(json)) {
            return Collections.emptyList();
        }
        return JSONUtil.toList(json, targetClass);
    }

    private List<WorkExpectDto> normalizeWorkExpectList(List<WorkExpectDto> list) {
        return list == null ? Collections.emptyList() : list;
    }

    private List<WorkExperienceDto> normalizeWorkExperienceList(List<WorkExperienceDto> list) {
        if(list == null) {
            return Collections.emptyList();
        }
        for(WorkExperienceDto dto : list) {
            if(dto == null) {
                continue;
            }
            if(StringUtils.isBlank(dto.getJob()) && StringUtils.isNotBlank(dto.getJobName())) {
                dto.setJob(dto.getJobName());
            }
            if(StringUtils.isBlank(dto.getJobName()) && StringUtils.isNotBlank(dto.getJob())) {
                dto.setJobName(dto.getJob());
            }
            if(StringUtils.isBlank(dto.getWorkContent()) && StringUtils.isNotBlank(dto.getWorkDetail())) {
                dto.setWorkContent(dto.getWorkDetail());
            }
            if(StringUtils.isBlank(dto.getWorkDetail()) && StringUtils.isNotBlank(dto.getWorkContent())) {
                dto.setWorkDetail(dto.getWorkContent());
            }
            dto.setWorkDateStart(normalizeMonthText(dto.getWorkDateStart()));
            dto.setWorkDateEnd(normalizeMonthText(dto.getWorkDateEnd()));
        }
        return list;
    }

    private List<ProjectExperienceDto> normalizeProjectExperienceList(List<ProjectExperienceDto> list) {
        if(list == null) {
            return Collections.emptyList();
        }
        for(ProjectExperienceDto dto : list) {
            if(dto == null) {
                continue;
            }
            if(StringUtils.isBlank(dto.getRole()) && StringUtils.isNotBlank(dto.getProjectRole())) {
                dto.setRole(dto.getProjectRole());
            }
            if(StringUtils.isBlank(dto.getProjectRole()) && StringUtils.isNotBlank(dto.getRole())) {
                dto.setProjectRole(dto.getRole());
            }
            if(StringUtils.isBlank(dto.getProjectContent()) && StringUtils.isNotBlank(dto.getProjectResult())) {
                dto.setProjectContent(dto.getProjectResult());
            }
            if(StringUtils.isBlank(dto.getProjectResult()) && StringUtils.isNotBlank(dto.getProjectContent())) {
                dto.setProjectResult(dto.getProjectContent());
            }
            dto.setProjectDateStart(normalizeMonthText(dto.getProjectDateStart()));
            dto.setProjectDateEnd(normalizeMonthText(dto.getProjectDateEnd()));
        }
        return list;
    }

    private LocalDateTime parseDate(String value) {
        String trimmed = StringUtils.trimToNull(value);
        if(trimmed == null) {
            return null;
        }
        try {
            if(trimmed.length() == 7) {
                return LocalDate.parse(trimmed + "-01", DATE_FORMATTER).atStartOfDay();
            }
            if(trimmed.length() == 10) {
                return LocalDate.parse(trimmed, DATE_FORMATTER).atStartOfDay();
            }
            return LocalDateTime.parse(trimmed, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("date format must be yyyy-MM, yyyy-MM-dd or yyyy-MM-dd HH:mm:ss");
        }
    }

    private String formatDate(LocalDateTime value) {
        if(value == null) {
            return "";
        }
        return DATE_FORMATTER.format(value);
    }

    private String normalizeMonthText(String value) {
        String trimmed = StringUtils.trimToNull(value);
        if(trimmed == null) {
            return "";
        }
        if(trimmed.matches("\\d{13}")) {
            return MONTH_FORMATTER.format(Instant.ofEpochMilli(Long.parseLong(trimmed)).atZone(CHINA_ZONE));
        }
        if(trimmed.matches("\\d{10}")) {
            return MONTH_FORMATTER.format(Instant.ofEpochSecond(Long.parseLong(trimmed)).atZone(CHINA_ZONE));
        }
        if(trimmed.length() >= 7 && trimmed.charAt(4) == '-') {
            return trimmed.substring(0, 7);
        }
        return trimmed;
    }

    private void refreshLoginMember(Member updateMember) {
        AppLoginMember loginMember = tokenHelper.getAppLoginMember();
        if(loginMember == null) {
            return;
        }
        if(updateMember.getFullName() != null) {
            loginMember.setFullName(updateMember.getFullName());
        }
        if(updateMember.getGender() != null) {
            loginMember.setGender(updateMember.getGender());
        }
        if(updateMember.getBirthday() != null) {
            loginMember.setBirthday(updateMember.getBirthday());
        }
        if(updateMember.getWorkDate() != null) {
            loginMember.setWorkDate(updateMember.getWorkDate());
        }
        if(updateMember.getWorkStatus() != null) {
            loginMember.setWorkStatus(updateMember.getWorkStatus());
        }
        if(updateMember.getHighestQualification() != null) {
            loginMember.setHighestQualification(updateMember.getHighestQualification());
        }
        if(updateMember.getHighestQualificationType() != null) {
            loginMember.setHighestQualificationType(updateMember.getHighestQualificationType());
        }
        if(updateMember.getAvatar() != null) {
            loginMember.setAvatar(updateMember.getAvatar());
        }
        tokenHelper.updateAppLoginMember(loginMember);
    }
}
