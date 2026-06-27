package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.job.cqrs.response.BossMineJobOverviewResponse;
import com.whoiszxl.zhipin.job.feign.JobMineFeignClient;
import com.whoiszxl.zhipin.member.cqrs.response.BossMineOverviewResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeRefreshResponse;
import com.whoiszxl.zhipin.member.cqrs.response.WorkerMineOverviewResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberAttachmentResume;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.entity.MemberToutou;
import com.whoiszxl.zhipin.member.service.IMemberAttachmentResumeService;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.member.service.IMemberToutouService;
import com.whoiszxl.zhipin.member.service.IMineOverviewService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MineOverviewServiceImpl implements IMineOverviewService {

    private static final int ENABLED = 1;
    private static final int DISABLED = 0;
    private static final int LICENSE_STATUS_NOT_SUBMITTED = 0;
    private static final int LICENSE_STATUS_APPROVED = 1;
    private static final int RESUME_SCORE_TOTAL = 16;

    private final TokenHelper tokenHelper;
    private final IMemberService memberService;
    private final IMemberExpService memberExpService;
    private final IMemberAttachmentResumeService attachmentResumeService;
    private final IMemberToutouService memberToutouService;
    private final JobMineFeignClient jobMineFeignClient;

    @Override
    public WorkerMineOverviewResponse workerOverview() {
        Long memberId = tokenHelper.getAppMemberId();
        Member member = currentMember(memberId);
        MemberExp memberExp = currentMemberExp(memberId);

        WorkerMineOverviewResponse response = new WorkerMineOverviewResponse();
        response.setMemberId(memberId);
        response.setFullName(StringUtils.defaultString(member.getFullName()));
        response.setAvatar(StringUtils.defaultString(member.getAvatar()));
        response.setCity(StringUtils.defaultString(member.getCity()));
        response.setWorkStatus(member.getWorkStatus());

        int resumeScore = calculateResumeScore(member, memberExp);
        response.setOnlineResumeScore(resumeScore);
        response.setOnlineResumeCompleted(memberExp != null && resumeScore > 0);
        response.setOnlineResumeVisible(memberExp == null || !Integer.valueOf(DISABLED).equals(memberExp.getStatus()));
        response.setAttachmentResumeCount(toInt(attachmentResumeService.count(Wrappers.<MemberAttachmentResume>lambdaQuery()
                .eq(MemberAttachmentResume::getMemberId, memberId)
                .eq(MemberAttachmentResume::getStatus, ENABLED))));
        response.setResumeRefreshAvailable(isRefreshAvailable(memberExp == null ? null : memberExp.getResumeRefreshTime(), LocalDateTime.now()));
        response.setLastResumeRefreshTime(memberExp == null ? null : memberExp.getResumeRefreshTime());

        response.setCommunicatedCount(0);
        response.setDeliveredCount(0);
        response.setInterviewCount(0);
        response.setFavoriteJobCount(0);
        response.setResumeViewCount(0);
        return response;
    }

    @Override
    public BossMineOverviewResponse bossOverview() {
        Long memberId = tokenHelper.getAppMemberId();
        Member member = currentMember(memberId);

        BossMineOverviewResponse response = defaultBossResponse(member);
        fillJobOverview(response);
        fillLicenseOverview(response, memberId);
        response.setCandidateCount(toInt(memberExpService.count(Wrappers.<MemberExp>lambdaQuery()
                .eq(MemberExp::getStatus, ENABLED))));
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ResumeRefreshResponse refreshResume() {
        Long memberId = tokenHelper.getAppMemberId();
        MemberExp memberExp = currentMemberExp(memberId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastRefreshTime = memberExp == null ? null : memberExp.getResumeRefreshTime();

        if(!isRefreshAvailable(lastRefreshTime, now)) {
            return buildRefreshResponse(lastRefreshTime, false);
        }

        MemberExp updateMemberExp = new MemberExp();
        updateMemberExp.setMemberId(memberId);
        updateMemberExp.setResumeRefreshTime(now);
        updateMemberExp.setStatus(ENABLED);

        boolean saved = memberExp == null
                ? memberExpService.save(updateMemberExp)
                : memberExpService.update(updateMemberExp, Wrappers.<MemberExp>lambdaUpdate()
                        .eq(MemberExp::getMemberId, memberId));
        if(!saved) {
            throw new IllegalStateException("resume refresh failed");
        }
        return buildRefreshResponse(now, false);
    }

    private Member currentMember(Long memberId) {
        Member member = memberService.getById(memberId);
        if(member == null) {
            throw new IllegalArgumentException("member does not exist");
        }
        return member;
    }

    private MemberExp currentMemberExp(Long memberId) {
        return memberExpService.getOne(Wrappers.<MemberExp>lambdaQuery()
                .eq(MemberExp::getMemberId, memberId)
                .last("LIMIT 1"));
    }

    private BossMineOverviewResponse defaultBossResponse(Member member) {
        BossMineOverviewResponse response = new BossMineOverviewResponse();
        response.setMemberId(member.getId());
        response.setFullName(StringUtils.defaultString(member.getFullName()));
        response.setAvatar(StringUtils.defaultString(member.getAvatar()));
        response.setIsToutou(member.getIsToutou());
        response.setCompanyFullName("");
        response.setCompanyAbbrName("");
        response.setCompanyLogo("");
        response.setCompanyVerified(false);
        response.setCompanyProfileCompleted(false);
        response.setOnlineJobCount(0);
        response.setOfflineJobCount(0);
        response.setCandidateCount(0);
        response.setUnreadMessageCount(0);
        response.setTodayViewCount(0);
        response.setTodayChatCount(0);
        response.setLicenseSubmitted(false);
        response.setLicenseAuditStatus(LICENSE_STATUS_NOT_SUBMITTED);
        response.setLicenseAuditText("\u672a\u63d0\u4ea4");
        return response;
    }

    private void fillJobOverview(BossMineOverviewResponse response) {
        try {
            ResponseResult<BossMineJobOverviewResponse> result = jobMineFeignClient.bossMineOverview();
            if(result == null || !Integer.valueOf(0).equals(result.getCode()) || result.getData() == null) {
                return;
            }
            BossMineJobOverviewResponse data = result.getData();
            response.setCompanyId(data.getCompanyId());
            response.setCompanyFullName(StringUtils.defaultString(data.getCompanyFullName()));
            response.setCompanyAbbrName(StringUtils.defaultString(data.getCompanyAbbrName()));
            response.setCompanyLogo(StringUtils.defaultString(data.getCompanyLogo()));
            response.setCompanyProfileCompleted(Boolean.TRUE.equals(data.getCompanyProfileCompleted()));
            response.setOnlineJobCount(defaultInt(data.getOnlineJobCount()));
            response.setOfflineJobCount(defaultInt(data.getOfflineJobCount()));
        } catch (Exception e) {
            log.warn("load boss job overview failed", e);
        }
    }

    private void fillLicenseOverview(BossMineOverviewResponse response, Long memberId) {
        MemberToutou toutou = memberToutouService.getOne(Wrappers.<MemberToutou>lambdaQuery()
                .eq(MemberToutou::getMemberId, memberId)
                .last("LIMIT 1"));
        boolean licenseSubmitted = toutou != null && StringUtils.isNotBlank(toutou.getBusinessLicense());
        response.setLicenseSubmitted(licenseSubmitted);
        response.setCompanyVerified(licenseSubmitted);
        response.setLicenseAuditStatus(licenseSubmitted ? LICENSE_STATUS_APPROVED : LICENSE_STATUS_NOT_SUBMITTED);
        response.setLicenseAuditText(licenseSubmitted ? "\u5df2\u8ba4\u8bc1" : "\u672a\u63d0\u4ea4");
    }

    private int calculateResumeScore(Member member, MemberExp memberExp) {
        int completed = 0;
        completed += hasText(member.getFullName()) ? 1 : 0;
        completed += hasText(member.getAvatar()) ? 1 : 0;
        completed += hasText(member.getCity()) ? 1 : 0;
        completed += member.getGender() != null && member.getGender() > 0 ? 1 : 0;
        completed += member.getBirthday() != null ? 1 : 0;
        completed += member.getWorkStatus() != null && member.getWorkStatus() > 0 ? 1 : 0;
        completed += member.getWorkDate() != null ? 1 : 0;
        completed += member.getHighestQualification() != null && member.getHighestQualification() > 0 ? 1 : 0;
        completed += member.getHighestQualificationType() != null && member.getHighestQualificationType() > 0 ? 1 : 0;

        if(memberExp != null) {
            completed += hasText(memberExp.getAdvantage()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getWorkExpect()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getWorkExperience()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getProjectExperience()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getEduExperience()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getQualification()) ? 1 : 0;
            completed += hasJsonValue(memberExp.getSkillTags()) ? 1 : 0;
        }

        return (int) Math.round(completed * 100.0D / RESUME_SCORE_TOTAL);
    }

    private boolean hasText(String value) {
        return StringUtils.isNotBlank(value);
    }

    private boolean hasJsonValue(String value) {
        String trimmed = StringUtils.trimToEmpty(value);
        return StringUtils.isNotBlank(trimmed) && !"[]".equals(trimmed) && !"{}".equals(trimmed);
    }

    private boolean isRefreshAvailable(LocalDateTime lastRefreshTime, LocalDateTime now) {
        return lastRefreshTime == null || !lastRefreshTime.plusDays(1).isAfter(now);
    }

    private ResumeRefreshResponse buildRefreshResponse(LocalDateTime lastRefreshTime, boolean available) {
        ResumeRefreshResponse response = new ResumeRefreshResponse();
        response.setLastResumeRefreshTime(lastRefreshTime);
        response.setResumeRefreshAvailable(available);
        response.setNextRefreshTime(lastRefreshTime == null ? null : lastRefreshTime.plusDays(1));
        return response;
    }

    private Integer defaultInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Integer toInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }
}
