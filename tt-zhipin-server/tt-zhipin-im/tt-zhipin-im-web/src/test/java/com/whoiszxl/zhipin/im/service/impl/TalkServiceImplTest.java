package com.whoiszxl.zhipin.im.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.whoiszxl.zhipin.im.constants.TalkTypeEnum;
import com.whoiszxl.zhipin.im.cqrs.command.TalkAddCommand;
import com.whoiszxl.zhipin.im.cqrs.query.TalkQuery;
import com.whoiszxl.zhipin.im.cqrs.response.TalkResponse;
import com.whoiszxl.zhipin.im.entity.Talk;
import com.whoiszxl.zhipin.im.mapper.TalkMapper;
import com.whoiszxl.zhipin.member.dto.MemberDTO;
import com.whoiszxl.zhipin.member.feign.MemberFeignClient;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TalkServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(Talk.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, TalkMapper.class.getName()),
                Talk.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private MemberFeignClient memberFeignClient;

    @Spy
    @InjectMocks
    private TalkServiceImpl talkService;

    @Test
    void ensurePrivateTalkUsesCurrentMemberAndCreatesBothVisibleTalks() {
        when(tokenHelper.getAppMemberId()).thenReturn(100L);
        mockMember(100L, "Worker", "https://example.com/worker.png");
        mockMember(200L, "Boss", "https://example.com/boss.png");
        doReturn(null).when(talkService).getOne(anyTalkWrapper());
        doReturn(true).when(talkService).save(any(Talk.class));

        TalkAddCommand command = new TalkAddCommand();
        command.setFromMemberId(999L);
        command.setToMemberId(200L);

        TalkResponse response = talkService.ensurePrivateTalk(command);

        ArgumentCaptor<Talk> talkCaptor = ArgumentCaptor.forClass(Talk.class);
        verify(talkService, times(2)).save(talkCaptor.capture());
        List<Talk> savedTalks = talkCaptor.getAllValues();

        Talk currentMemberTalk = savedTalks.get(0);
        assertThat(currentMemberTalk.getFromMemberId()).isEqualTo(200L);
        assertThat(currentMemberTalk.getToMemberId()).isEqualTo(100L);
        assertThat(JSONUtil.parseObj(currentMemberTalk.getFromMemberInfo()).getStr("name")).isEqualTo("Boss");

        Talk targetMemberTalk = savedTalks.get(1);
        assertThat(targetMemberTalk.getFromMemberId()).isEqualTo(100L);
        assertThat(targetMemberTalk.getToMemberId()).isEqualTo(200L);
        assertThat(JSONUtil.parseObj(targetMemberTalk.getFromMemberInfo()).getStr("name")).isEqualTo("Worker");

        assertThat(response.getFromMemberId()).isEqualTo(200L);
        assertThat(response.getToMemberId()).isEqualTo(100L);
        assertThat(JSONUtil.parseObj(response.getFromMemberInfo()).getStr("name")).isEqualTo("Boss");
    }

    @Test
    void ensurePrivateTalkReusesExistingTalkAndBackfillsMissingMemberInfo() {
        when(tokenHelper.getAppMemberId()).thenReturn(100L);
        mockMember(100L, "Worker", "https://example.com/worker.png");
        mockMember(200L, "Boss", "https://example.com/boss.png");

        Talk currentMemberTalk = talk(11L, 200L, 100L, "");
        Talk targetMemberTalk = talk(12L, 100L, 200L, "{\"name\":\"Worker\",\"avatar\":\"https://example.com/worker.png\"}");
        doReturn(currentMemberTalk, targetMemberTalk).when(talkService).getOne(anyTalkWrapper());
        doReturn(true).when(talkService).updateById(any(Talk.class));

        TalkAddCommand command = new TalkAddCommand();
        command.setToMemberId(200L);

        TalkResponse response = talkService.ensurePrivateTalk(command);

        verify(talkService, never()).save(any(Talk.class));
        ArgumentCaptor<Talk> talkCaptor = ArgumentCaptor.forClass(Talk.class);
        verify(talkService).updateById(talkCaptor.capture());
        assertThat(talkCaptor.getValue().getId()).isEqualTo(11L);
        assertThat(JSONUtil.parseObj(talkCaptor.getValue().getFromMemberInfo()).getStr("name")).isEqualTo("Boss");
        assertThat(response.getId()).isEqualTo(11L);
        assertThat(JSONUtil.parseObj(response.getFromMemberInfo()).getStr("name")).isEqualTo("Boss");
    }

    @Test
    void talkListReturnsParseableMemberInfoForExistingTalks() {
        when(tokenHelper.getAppMemberId()).thenReturn(100L);
        mockMember(200L, "Boss", "https://example.com/boss.png");

        Talk existingTalk = talk(11L, 200L, 100L, "not-json");
        IPage<Talk> page = new Page<Talk>(1, 10).setRecords(Collections.singletonList(existingTalk));
        page.setTotal(1L);
        doReturn(page).when(talkService).page(any(), anyTalkWrapper());
        doReturn(true).when(talkService).updateById(any(Talk.class));

        PageResponse<TalkResponse> response = talkService.talkList(new TalkQuery());

        assertThat(response.getList()).hasSize(2);
        TalkResponse visibleTalk = response.getList().get(1);
        assertThat(visibleTalk.getId()).isEqualTo(11L);
        assertThat(JSONUtil.parseObj(visibleTalk.getFromMemberInfo()).getStr("name")).isEqualTo("Boss");
    }

    private void mockMember(Long memberId, String fullName, String avatar) {
        MemberDTO memberDTO = new MemberDTO();
        memberDTO.setId(memberId);
        memberDTO.setFullName(fullName);
        memberDTO.setAvatar(avatar);
        when(memberFeignClient.getMemberInfoById(memberId)).thenReturn(ResponseResult.buildSuccess(memberDTO));
    }

    private Talk talk(Long id, Long fromMemberId, Long toMemberId, String fromMemberInfo) {
        Talk talk = new Talk();
        talk.setId(id);
        talk.setTalkType(TalkTypeEnum.PRIVATE_CHAT.getCode());
        talk.setFromMemberId(fromMemberId);
        talk.setToMemberId(toMemberId);
        talk.setFromMemberInfo(fromMemberInfo);
        talk.setMuteStatus(0);
        talk.setTopStatus(0);
        talk.setReadSequence(0L);
        talk.setSequence(0L);
        talk.setVersion(1L);
        talk.setStatus(1);
        talk.setIsDeleted(0);
        return talk;
    }

    @SuppressWarnings("unchecked")
    private Wrapper<Talk> anyTalkWrapper() {
        return any(Wrapper.class);
    }
}
