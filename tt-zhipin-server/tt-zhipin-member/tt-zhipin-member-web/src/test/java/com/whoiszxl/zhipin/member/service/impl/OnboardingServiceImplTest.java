package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.json.JSONUtil;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingCompleteCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingDraftSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingRoleCommand;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingDraftResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingOptionsResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingStatusResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.entity.MemberOnboarding;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private IMemberService memberService;

    @Mock
    private IMemberExpService memberExpService;

    @Spy
    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    @Test
    void optionsExposeCompanyRestAndOvertimeEnums() {
        OnboardingOptionsResponse response = onboardingService.options();

        assertThat(response.getRestWays())
                .extracting("value")
                .containsExactly("1", "2");
        assertThat(response.getRestWays())
                .extracting("label")
                .containsExactly("双休", "排班轮休");
        assertThat(response.getOvertimeOptions())
                .extracting("value")
                .containsExactly("1", "2", "3");
        assertThat(response.getOvertimeOptions())
                .extracting("label")
                .containsExactly("不加班", "偶尔加班", "弹性工作");
    }

    @Test
    void statusReturnsRoleSelectWhenCurrentMemberHasNoOnboardingRecord() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(onboardingService).getOne(any());

        OnboardingStatusResponse response = onboardingService.status();

        assertThat(response.getMemberId()).isEqualTo(123L);
        assertThat(response.getRole()).isNull();
        assertThat(response.getNextPage()).isEqualTo("ROLE_SELECT");
        assertThat(response.getJobseekerCompleted()).isFalse();
        assertThat(response.getBossCompleted()).isFalse();
    }

    @Test
    void chooseBossRoleCreatesOnboardingRecordAndRefreshesBossIdentity() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(onboardingService).getOne(any());
        doReturn(true).when(onboardingService).save(any(MemberOnboarding.class));
        when(memberService.becomeBoss()).thenReturn(true);

        OnboardingRoleCommand command = new OnboardingRoleCommand();
        command.setRole("BOSS");

        OnboardingStatusResponse response = onboardingService.chooseRole(command);

        assertThat(response.getRole()).isEqualTo("BOSS");
        assertThat(response.getCurrentStep()).isEqualTo("ROLE_SELECTED");
        assertThat(response.getNextPage()).isEqualTo("BOSS_ONBOARDING");
        verify(memberService).becomeBoss();

        ArgumentCaptor<MemberOnboarding> captor = ArgumentCaptor.forClass(MemberOnboarding.class);
        verify(onboardingService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getRole()).isEqualTo("BOSS");
        assertThat(captor.getValue().getCurrentStep()).isEqualTo("ROLE_SELECTED");
    }

    @Test
    void saveDraftMergesStepDataAndUpdatesProgress() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        MemberOnboarding existing = new MemberOnboarding();
        existing.setMemberId(123L);
        existing.setRole("JOBSEEKER");
        existing.setJobseekerDraft("{\"salary\":{\"salaryRangeStart\":12}}");
        doReturn(existing).when(onboardingService).getOne(any());
        doReturn(true).when(onboardingService).update(any(MemberOnboarding.class), any());

        OnboardingDraftSaveCommand command = new OnboardingDraftSaveCommand();
        command.setRole("JOBSEEKER");
        command.setStepKey("basic_info");
        command.setStepIndex(3);
        Map<String, Object> stepData = new LinkedHashMap<>();
        stepData.put("fullName", "张三");
        stepData.put("gender", 1);
        command.setStepData(stepData);

        OnboardingDraftResponse response = onboardingService.saveDraft(command);

        assertThat(response.getRole()).isEqualTo("JOBSEEKER");
        assertThat(response.getCurrentStep()).isEqualTo("basic_info");
        assertThat(response.getCurrentStepIndex()).isEqualTo(3);
        assertThat(response.getDraft()).containsKeys("salary", "basic_info");

        ArgumentCaptor<MemberOnboarding> captor = ArgumentCaptor.forClass(MemberOnboarding.class);
        verify(onboardingService).update(captor.capture(), any());
        MemberOnboarding updated = captor.getValue();
        assertThat(updated.getCurrentStep()).isEqualTo("basic_info");
        assertThat(updated.getCurrentStepIndex()).isEqualTo(3);
        assertThat(JSONUtil.parseObj(updated.getJobseekerDraft()).getJSONObject("basic_info").getStr("fullName"))
                .isEqualTo("张三");
    }

    @Test
    void completeJobseekerMaterializesDraftIntoMemberAndResume() {
        Long memberId = 123L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        AppLoginMember loginMember = new AppLoginMember();
        loginMember.setId(memberId);
        when(tokenHelper.getAppLoginMember()).thenReturn(loginMember);

        MemberOnboarding onboarding = new MemberOnboarding();
        onboarding.setMemberId(memberId);
        onboarding.setRole("JOBSEEKER");
        onboarding.setJobseekerDraft(JSONUtil.createObj()
                .set("job_preference", JSONUtil.createObj()
                        .set("isStudent", true)
                        .set("city", "泉州")
                        .set("jobs", Arrays.asList("产品经理", "AI产品经理")))
                .set("salary", JSONUtil.createObj()
                        .set("salaryRangeStart", 10)
                        .set("salaryRangeEnd", 20))
                .set("basic_info", JSONUtil.createObj()
                        .set("fullName", "张三")
                        .set("gender", 1)
                        .set("birthYear", 1992)
                        .set("birthMonth", 8))
                .set("work_status", JSONUtil.createObj().set("workStatus", 1))
                .set("first_work_time", JSONUtil.createObj().set("year", 2015).set("month", 6))
                .set("recent_work", JSONUtil.createObj().set("jobName", "产品经理").set("industry", "互联网/AI"))
                .set("recent_company", JSONUtil.createObj().set("companyFullName", "AI智聘科技"))
                .set("work_period", JSONUtil.createObj()
                        .set("startYear", 2020)
                        .set("startMonth", 1)
                        .set("endYear", 2024)
                        .set("endMonth", 12))
                .set("skills", JSONUtil.createObj().set("skills", Arrays.asList("需求分析", "项目管理")))
                .set("work_detail", JSONUtil.createObj().set("workDetail", "负责招聘产品规划"))
                .set("education", JSONUtil.createObj()
                        .set("highestQualification", 5)
                        .set("highestQualificationType", 1))
                .set("school", JSONUtil.createObj().set("schoolName", "福建师范大学"))
                .set("major", JSONUtil.createObj().set("major", "信息管理"))
                .set("education_period", JSONUtil.createObj().set("yearStart", 2010).set("yearEnd", 2014))
                .set("advantage", JSONUtil.createObj().set("advantage", "沟通能力强"))
                .set("avatar", JSONUtil.createObj().set("avatar", "https://example.com/avatar.png"))
                .toString());
        doReturn(onboarding).when(onboardingService).getOne(any());

        when(memberService.updateById(any(Member.class))).thenReturn(true);
        when(memberExpService.getOne(any())).thenReturn(null);
        when(memberExpService.save(any(MemberExp.class))).thenReturn(true);
        doReturn(true).when(onboardingService).update(any(MemberOnboarding.class), any());

        OnboardingCompleteCommand command = new OnboardingCompleteCommand();
        command.setRole("JOBSEEKER");

        OnboardingStatusResponse response = onboardingService.complete(command);

        assertThat(response.getJobseekerCompleted()).isTrue();
        assertThat(response.getNextPage()).isEqualTo("JOBSEEKER_HOME");

        ArgumentCaptor<Member> memberCaptor = ArgumentCaptor.forClass(Member.class);
        verify(memberService).updateById(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getFullName()).isEqualTo("张三");
        assertThat(memberCaptor.getValue().getGender()).isEqualTo(1);
        assertThat(memberCaptor.getValue().getIdentityStatus()).isEqualTo(2);
        assertThat(memberCaptor.getValue().getHighestQualification()).isEqualTo(5);
        assertThat(memberCaptor.getValue().getAvatar()).isEqualTo("https://example.com/avatar.png");

        ArgumentCaptor<MemberExp> memberExpCaptor = ArgumentCaptor.forClass(MemberExp.class);
        verify(memberExpService).save(memberExpCaptor.capture());
        MemberExp savedExp = memberExpCaptor.getValue();
        assertThat(savedExp.getMemberId()).isEqualTo(memberId);
        assertThat(savedExp.getAdvantage()).isEqualTo("沟通能力强");
        assertThat(savedExp.getWorkExpect()).contains("产品经理");
        assertThat(savedExp.getWorkExperience()).contains("AI智聘科技");
        assertThat(savedExp.getEduExperience()).contains("福建师范大学");
        assertThat(savedExp.getSkillTags()).contains("需求分析");
    }

    @Test
    void completeJobseekerRejectsMoreThanThreeExpectedJobs() {
        Long memberId = 123L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);

        MemberOnboarding onboarding = new MemberOnboarding();
        onboarding.setMemberId(memberId);
        onboarding.setRole("JOBSEEKER");
        onboarding.setJobseekerDraft(JSONUtil.createObj()
                .set("job_preference", JSONUtil.createObj()
                        .set("jobs", Arrays.asList("Java", "FE", "QA", "PM")))
                .toString());
        doReturn(onboarding).when(onboardingService).getOne(any());

        OnboardingCompleteCommand command = new OnboardingCompleteCommand();
        command.setRole("JOBSEEKER");

        assertThatThrownBy(() -> onboardingService.complete(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("up to 3 expected jobs");
    }
}
