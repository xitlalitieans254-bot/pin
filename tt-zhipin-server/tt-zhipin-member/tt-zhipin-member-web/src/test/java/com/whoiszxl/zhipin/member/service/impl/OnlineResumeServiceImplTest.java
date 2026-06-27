package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.ResumeVisibilityCommand;
import com.whoiszxl.zhipin.member.cqrs.dto.ProjectExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.response.BossMemberResumeDetailResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnlineResumeResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeVisibilityResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnlineResumeServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private IMemberService memberService;

    @Mock
    private IMemberExpService memberExpService;

    @InjectMocks
    private OnlineResumeServiceImpl onlineResumeService;

    @Test
    void infoReturnsEmptyResumeForMemberWithoutExperienceRecord() {
        Long memberId = 123L;
        Member member = new Member();
        member.setId(memberId);
        member.setPhone("13800138000");

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberService.getById(memberId)).thenReturn(member);
        when(memberExpService.getOne(any())).thenReturn(null);

        OnlineResumeResponse response = onlineResumeService.info();

        assertThat(response.getMemberInfoResponse()).isNotNull();
        assertThat(response.getMemberInfoResponse().getId()).isEqualTo(memberId);
        assertThat(response.getWorkExpectDtoList()).isEmpty();
        assertThat(response.getWorkExperienceDtoList()).isEmpty();
        assertThat(response.getProjectExperienceDtoList()).isEmpty();
        assertThat(response.getEduExperienceDtoList()).isEmpty();
        assertThat(response.getQualificationList()).isEmpty();
        assertThat(response.getAdvantage()).isEqualTo("");
    }

    @Test
    void savePersistsEmptyListsSoDeletedSectionsAreCleared() {
        Long memberId = 123L;
        MemberExp existingMemberExp = new MemberExp();
        existingMemberExp.setMemberId(memberId);

        OnlineResumeSaveCommand saveCommand = new OnlineResumeSaveCommand();
        saveCommand.setAdvantage("");
        saveCommand.setWorkExpectDtoList(Collections.emptyList());
        saveCommand.setWorkExperienceDtoList(Collections.emptyList());
        saveCommand.setProjectExperienceDtoList(Collections.emptyList());
        saveCommand.setEduExperienceDtoList(Collections.emptyList());
        saveCommand.setQualificationList(Collections.emptyList());
        saveCommand.setSkillTagList(Collections.emptyList());

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberExpService.getOne(any())).thenReturn(existingMemberExp);
        when(memberExpService.update(any(MemberExp.class), any())).thenReturn(true);

        boolean saved = onlineResumeService.save(saveCommand);

        assertThat(saved).isTrue();
        ArgumentCaptor<MemberExp> memberExpCaptor = ArgumentCaptor.forClass(MemberExp.class);
        verify(memberExpService).update(memberExpCaptor.capture(), anyWrapper());

        MemberExp updatedMemberExp = memberExpCaptor.getValue();
        assertThat(updatedMemberExp.getMemberId()).isEqualTo(memberId);
        assertThat(updatedMemberExp.getAdvantage()).isEqualTo("");
        assertThat(updatedMemberExp.getWorkExpect()).isEqualTo("[]");
        assertThat(updatedMemberExp.getWorkExperience()).isEqualTo("[]");
        assertThat(updatedMemberExp.getProjectExperience()).isEqualTo("[]");
        assertThat(updatedMemberExp.getEduExperience()).isEqualTo("[]");
        assertThat(updatedMemberExp.getQualification()).isEqualTo("[]");
        assertThat(updatedMemberExp.getSkillTags()).isEqualTo("[]");
    }

    @Test
    void savePersistsBaseProfileAndNormalizesFrontendAliasFields() {
        Long memberId = 123L;
        OnlineResumeSaveCommand saveCommand = new OnlineResumeSaveCommand();
        saveCommand.setFullName("张三");
        saveCommand.setGender(1);
        saveCommand.setBirthday("1998-06-01");
        saveCommand.setAvatar("https://example.com/avatar.png");
        saveCommand.setCity("长沙");
        saveCommand.setWorkStatus(1);
        saveCommand.setWorkDate("2022-03");
        saveCommand.setHighestQualification(5);
        saveCommand.setHighestQualificationType(1);

        WorkExperienceDto workExperienceDto = new WorkExperienceDto();
        workExperienceDto.setCompanyFullName("某某科技有限公司");
        workExperienceDto.setJob("AI产品经理");
        workExperienceDto.setWorkContent("负责产品规划");
        workExperienceDto.setWorkDateStart("2022-03");
        workExperienceDto.setWorkDateEnd("2025-06");
        saveCommand.setWorkExperienceDtoList(Collections.singletonList(workExperienceDto));

        ProjectExperienceDto projectExperienceDto = new ProjectExperienceDto();
        projectExperienceDto.setProjectName("AI招聘助手");
        projectExperienceDto.setRole("产品负责人");
        projectExperienceDto.setProjectContent("负责项目落地");
        saveCommand.setProjectExperienceDtoList(Collections.singletonList(projectExperienceDto));

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberService.updateById(any(Member.class))).thenReturn(true);
        when(memberExpService.getOne(any())).thenReturn(null);
        when(memberExpService.save(any(MemberExp.class))).thenReturn(true);

        boolean saved = onlineResumeService.save(saveCommand);

        assertThat(saved).isTrue();
        ArgumentCaptor<Member> memberCaptor = ArgumentCaptor.forClass(Member.class);
        verify(memberService).updateById(memberCaptor.capture());
        Member updatedMember = memberCaptor.getValue();
        assertThat(updatedMember.getId()).isEqualTo(memberId);
        assertThat(updatedMember.getFullName()).isEqualTo("张三");
        assertThat(updatedMember.getBirthday()).isEqualTo(LocalDateTime.of(1998, 6, 1, 0, 0));
        assertThat(updatedMember.getWorkDate()).isEqualTo(LocalDateTime.of(2022, 3, 1, 0, 0));
        assertThat(updatedMember.getHighestQualification()).isEqualTo(5);

        ArgumentCaptor<MemberExp> memberExpCaptor = ArgumentCaptor.forClass(MemberExp.class);
        verify(memberExpService).save(memberExpCaptor.capture());
        MemberExp savedExp = memberExpCaptor.getValue();
        assertThat(savedExp.getStatus()).isEqualTo(1);
        assertThat(savedExp.getWorkExperience()).contains("AI产品经理", "jobName", "workContent");
        assertThat(savedExp.getProjectExperience()).contains("产品负责人", "projectRole", "projectContent");
    }

    @Test
    void updateVisibilityCreatesResumeRecordWhenMissing() {
        Long memberId = 123L;
        ResumeVisibilityCommand command = new ResumeVisibilityCommand();
        command.setVisible(false);

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberExpService.getOne(any())).thenReturn(null);
        when(memberExpService.save(any(MemberExp.class))).thenReturn(true);

        ResumeVisibilityResponse response = onlineResumeService.updateVisibility(command);

        assertThat(response.getVisible()).isFalse();
        ArgumentCaptor<MemberExp> memberExpCaptor = ArgumentCaptor.forClass(MemberExp.class);
        verify(memberExpService).save(memberExpCaptor.capture());
        assertThat(memberExpCaptor.getValue().getMemberId()).isEqualTo(memberId);
        assertThat(memberExpCaptor.getValue().getStatus()).isEqualTo(0);
    }

    @Test
    void bossDetailReturnsFlattenedCompleteResume() {
        Long memberId = 123L;
        Member member = new Member();
        member.setId(memberId);
        member.setFullName("张三");
        member.setAvatar("https://example.com/avatar.png");
        member.setCity("长沙");
        member.setBirthday(LocalDateTime.of(1998, 6, 1, 0, 0));
        member.setLastLogin(LocalDateTime.of(2026, 6, 27, 10, 0));

        WorkExpectDto workExpectDto = new WorkExpectDto();
        workExpectDto.setJob("AI产品经理");
        workExpectDto.setCity("长沙");
        workExpectDto.setSalaryRangeStart(15);
        workExpectDto.setSalaryRangeEnd(25);

        WorkExperienceDto workExperienceDto = new WorkExperienceDto();
        workExperienceDto.setCompanyFullName("某某科技有限公司");
        workExperienceDto.setJobName("AI产品经理");
        workExperienceDto.setWorkDetail("负责产品规划");
        workExperienceDto.setWorkDateStart("1622476800000");
        workExperienceDto.setWorkDateEnd("2025-06-01 00:00:00");

        MemberExp memberExp = new MemberExp();
        memberExp.setMemberId(memberId);
        memberExp.setStatus(1);
        memberExp.setAdvantage("沟通能力强");
        memberExp.setWorkExpect(cn.hutool.json.JSONUtil.toJsonStr(Collections.singletonList(workExpectDto)));
        memberExp.setWorkExperience(cn.hutool.json.JSONUtil.toJsonStr(Collections.singletonList(workExperienceDto)));
        memberExp.setQualification(cn.hutool.json.JSONUtil.toJsonStr(Arrays.asList("PMP")));

        when(memberService.getById(memberId)).thenReturn(member);
        when(memberExpService.getOne(any())).thenReturn(memberExp);

        BossMemberResumeDetailResponse response = onlineResumeService.bossDetail(memberId);

        assertThat(response.getMemberId()).isEqualTo(memberId);
        assertThat(response.getFullName()).isEqualTo("张三");
        assertThat(response.getBirthday()).isEqualTo("1998-06-01");
        assertThat(response.getVisible()).isTrue();
        assertThat(response.getCanChat()).isTrue();
        assertThat(response.getLastActiveTime()).isEqualTo(LocalDateTime.of(2026, 6, 27, 10, 0));
        assertThat(response.getAdvantage()).isEqualTo("沟通能力强");
        assertThat(response.getWorkExpectDtoList()).hasSize(1);
        assertThat(response.getWorkExperienceDtoList()).hasSize(1);
        assertThat(response.getWorkExperienceDtoList().get(0).getWorkDateStart()).isEqualTo("2021-06");
        assertThat(response.getWorkExperienceDtoList().get(0).getWorkDateEnd()).isEqualTo("2025-06");
        assertThat(response.getWorkExperienceDtoList().get(0).getJob()).isEqualTo("AI产品经理");
        assertThat(response.getQualificationList()).containsExactly("PMP");
    }

    private Wrapper<MemberExp> anyWrapper() {
        return any();
    }
}
