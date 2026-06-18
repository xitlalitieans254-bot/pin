package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.OnlineResumeResponse;
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

    private Wrapper<MemberExp> anyWrapper() {
        return any();
    }
}
