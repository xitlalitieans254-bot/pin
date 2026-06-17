package com.whoiszxl.zhipin.member.service.impl;

import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberToutou;
import com.whoiszxl.zhipin.member.service.IMemberToutouService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private IMemberToutouService memberToutouService;

    @Spy
    @InjectMocks
    private MemberServiceImpl memberService;

    @Test
    void becomeBossCreatesToutouRecordWithMemberIdAndRefreshesLoginState() {
        Long memberId = 123L;
        Member member = new Member();
        member.setId(memberId);
        member.setPhone("13800138000");
        member.setFullName("Boss Wang");
        member.setIsToutou(0);

        AppLoginMember loginMember = new AppLoginMember();
        loginMember.setId(memberId);
        loginMember.setIsToutou(0);

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(tokenHelper.getAppLoginMember()).thenReturn(loginMember);
        doReturn(member).when(memberService).getById(memberId);
        doReturn(true).when(memberService).updateById(member);
        when(memberToutouService.save(org.mockito.ArgumentMatchers.any(MemberToutou.class))).thenReturn(true);

        Boolean result = memberService.becomeBoss();

        assertThat(result).isTrue();
        assertThat(member.getIsToutou()).isEqualTo(1);
        assertThat(loginMember.getIsToutou()).isEqualTo(1);
        verify(tokenHelper).updateAppLoginMember(loginMember);

        ArgumentCaptor<MemberToutou> toutouCaptor = ArgumentCaptor.forClass(MemberToutou.class);
        verify(memberToutouService).save(toutouCaptor.capture());
        assertThat(toutouCaptor.getValue().getMemberId()).isEqualTo(memberId);
        assertThat(toutouCaptor.getValue().getPhone()).isEqualTo("13800138000");
    }

    @Test
    void becomeBossUpdatesExistingToutouRecordWhenStatusOutOfSync() {
        Long memberId = 123L;
        Member member = new Member();
        member.setId(memberId);
        member.setPhone("13800138000");
        member.setFullName("Boss Wang");
        member.setIsToutou(0);

        MemberToutou existingToutou = new MemberToutou();
        existingToutou.setMemberId(memberId);

        AppLoginMember loginMember = new AppLoginMember();
        loginMember.setId(memberId);
        loginMember.setIsToutou(0);

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(tokenHelper.getAppLoginMember()).thenReturn(loginMember);
        doReturn(member).when(memberService).getById(memberId);
        doReturn(true).when(memberService).updateById(member);
        when(memberToutouService.getOne(org.mockito.ArgumentMatchers.any())).thenReturn(existingToutou);
        when(memberToutouService.update(org.mockito.ArgumentMatchers.any(MemberToutou.class),
                org.mockito.ArgumentMatchers.any())).thenReturn(true);

        Boolean result = memberService.becomeBoss();

        assertThat(result).isTrue();
        verify(memberToutouService, never()).save(org.mockito.ArgumentMatchers.any(MemberToutou.class));

        ArgumentCaptor<MemberToutou> toutouCaptor = ArgumentCaptor.forClass(MemberToutou.class);
        verify(memberToutouService).update(toutouCaptor.capture(), org.mockito.ArgumentMatchers.any());
        assertThat(toutouCaptor.getValue().getMemberId()).isEqualTo(memberId);
        assertThat(toutouCaptor.getValue().getPhone()).isEqualTo("13800138000");
        assertThat(loginMember.getIsToutou()).isEqualTo(1);
    }

    @Test
    void becomeBossRefreshesLoginStateWhenAlreadyBoss() {
        Long memberId = 123L;
        Member member = new Member();
        member.setId(memberId);
        member.setIsToutou(1);

        AppLoginMember loginMember = new AppLoginMember();
        loginMember.setId(memberId);
        loginMember.setIsToutou(0);

        when(tokenHelper.getAppMemberId()).thenReturn(memberId);
        when(tokenHelper.getAppLoginMember()).thenReturn(loginMember);
        doReturn(member).when(memberService).getById(memberId);

        Boolean result = memberService.becomeBoss();

        assertThat(result).isTrue();
        assertThat(loginMember.getIsToutou()).isEqualTo(1);
        verify(tokenHelper).updateAppLoginMember(loginMember);
        verify(memberToutouService, never()).save(org.mockito.ArgumentMatchers.any(MemberToutou.class));
    }
}
