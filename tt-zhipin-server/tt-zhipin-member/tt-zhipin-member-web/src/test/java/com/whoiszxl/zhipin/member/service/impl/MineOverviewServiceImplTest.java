package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.job.cqrs.response.BossMineJobOverviewResponse;
import com.whoiszxl.zhipin.job.feign.JobMineFeignClient;
import com.whoiszxl.zhipin.member.cqrs.response.BossMineOverviewResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeRefreshResponse;
import com.whoiszxl.zhipin.member.cqrs.response.WorkerMineOverviewResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.entity.MemberToutou;
import com.whoiszxl.zhipin.member.service.IMemberAttachmentResumeService;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.member.service.IMemberToutouService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MineOverviewServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private IMemberService memberService;

    @Mock
    private IMemberExpService memberExpService;

    @Mock
    private IMemberAttachmentResumeService attachmentResumeService;

    @Mock
    private IMemberToutouService memberToutouService;

    @Mock
    private JobMineFeignClient jobMineFeignClient;

    @InjectMocks
    private MineOverviewServiceImpl mineOverviewService;

    @Test
    void workerOverviewReturnsProfileResumeScoreAndDefaults() {
        Long memberId = 123L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberService.getById(memberId)).thenReturn(completeMember(memberId));

        MemberExp memberExp = new MemberExp();
        memberExp.setMemberId(memberId);
        memberExp.setStatus(1);
        memberExp.setAdvantage("Good communicator");
        memberExp.setWorkExpect("[{\"job\":\"AI PM\"}]");
        memberExp.setWorkExperience("[{\"companyFullName\":\"AI Zhipin\"}]");
        memberExp.setEduExperience("[{\"schoolName\":\"University\"}]");
        memberExp.setSkillTags("[\"AI\"]");
        memberExp.setResumeRefreshTime(LocalDateTime.now().minusDays(2));
        when(memberExpService.getOne(any())).thenReturn(memberExp);
        when(attachmentResumeService.count(any())).thenReturn(2L);

        WorkerMineOverviewResponse response = mineOverviewService.workerOverview();

        assertThat(response.getMemberId()).isEqualTo(memberId);
        assertThat(response.getFullName()).isEqualTo("Zhang San");
        assertThat(response.getOnlineResumeCompleted()).isTrue();
        assertThat(response.getOnlineResumeScore()).isGreaterThan(70);
        assertThat(response.getOnlineResumeVisible()).isTrue();
        assertThat(response.getAttachmentResumeCount()).isEqualTo(2);
        assertThat(response.getResumeRefreshAvailable()).isTrue();
        assertThat(response.getDeliveredCount()).isZero();
        assertThat(response.getFavoriteJobCount()).isZero();
    }

    @Test
    void bossOverviewMergesMemberJobAndLicenseState() {
        Long memberId = 456L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        Member member = new Member();
        member.setId(memberId);
        member.setFullName("Boss Li");
        member.setAvatar("https://example.com/boss.png");
        member.setIsToutou(1);
        when(memberService.getById(memberId)).thenReturn(member);

        BossMineJobOverviewResponse jobOverview = new BossMineJobOverviewResponse();
        jobOverview.setCompanyId(10L);
        jobOverview.setCompanyFullName("AI Zhipin Technology");
        jobOverview.setCompanyAbbrName("AI Zhipin");
        jobOverview.setCompanyLogo("https://example.com/logo.png");
        jobOverview.setCompanyProfileCompleted(true);
        jobOverview.setOnlineJobCount(3);
        jobOverview.setOfflineJobCount(1);
        when(jobMineFeignClient.bossMineOverview()).thenReturn(ResponseResult.buildSuccess(jobOverview));

        MemberToutou toutou = new MemberToutou();
        toutou.setMemberId(memberId);
        toutou.setBusinessLicense("https://example.com/license.png");
        when(memberToutouService.getOne(any())).thenReturn(toutou);
        when(memberExpService.count(any())).thenReturn(28L);

        BossMineOverviewResponse response = mineOverviewService.bossOverview();

        assertThat(response.getMemberId()).isEqualTo(memberId);
        assertThat(response.getCompanyId()).isEqualTo(10L);
        assertThat(response.getCompanyProfileCompleted()).isTrue();
        assertThat(response.getCompanyVerified()).isTrue();
        assertThat(response.getOnlineJobCount()).isEqualTo(3);
        assertThat(response.getOfflineJobCount()).isEqualTo(1);
        assertThat(response.getCandidateCount()).isEqualTo(28);
        assertThat(response.getLicenseSubmitted()).isTrue();
        assertThat(response.getLicenseAuditStatus()).isEqualTo(1);
        assertThat(response.getUnreadMessageCount()).isZero();
    }

    @Test
    void refreshResumeCreatesRefreshTimeWhenResumeRecordIsMissing() {
        Long memberId = 123L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(memberExpService.getOne(any())).thenReturn(null);
        when(memberExpService.save(any(MemberExp.class))).thenReturn(true);

        ResumeRefreshResponse response = mineOverviewService.refreshResume();

        assertThat(response.getResumeRefreshAvailable()).isFalse();
        assertThat(response.getLastResumeRefreshTime()).isNotNull();
        assertThat(response.getNextRefreshTime()).isEqualTo(response.getLastResumeRefreshTime().plusDays(1));
        ArgumentCaptor<MemberExp> captor = ArgumentCaptor.forClass(MemberExp.class);
        verify(memberExpService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(memberId);
        assertThat(captor.getValue().getStatus()).isEqualTo(1);
        assertThat(captor.getValue().getResumeRefreshTime()).isNotNull();
    }

    @Test
    void refreshResumeBeforeNextWindowDoesNotUpdateAgain() {
        Long memberId = 123L;
        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        MemberExp memberExp = new MemberExp();
        memberExp.setMemberId(memberId);
        memberExp.setResumeRefreshTime(LocalDateTime.now().minusHours(2));
        when(memberExpService.getOne(any())).thenReturn(memberExp);

        ResumeRefreshResponse response = mineOverviewService.refreshResume();

        assertThat(response.getResumeRefreshAvailable()).isFalse();
        assertThat(response.getLastResumeRefreshTime()).isEqualTo(memberExp.getResumeRefreshTime());
        verify(memberExpService, never()).save(any(MemberExp.class));
        verify(memberExpService, never()).update(any(MemberExp.class), any());
    }

    private Member completeMember(Long memberId) {
        Member member = new Member();
        member.setId(memberId);
        member.setFullName("Zhang San");
        member.setAvatar("https://example.com/avatar.png");
        member.setCity("Changsha");
        member.setGender(1);
        member.setBirthday(LocalDateTime.of(1998, 6, 1, 0, 0));
        member.setWorkStatus(1);
        member.setWorkDate(LocalDateTime.of(2022, 3, 1, 0, 0));
        member.setHighestQualification(5);
        member.setHighestQualificationType(1);
        return member;
    }
}
