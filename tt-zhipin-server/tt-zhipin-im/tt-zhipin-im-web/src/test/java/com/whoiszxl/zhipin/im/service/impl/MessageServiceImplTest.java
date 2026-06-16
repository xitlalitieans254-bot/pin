package com.whoiszxl.zhipin.im.service.impl;

import cn.hutool.json.JSONUtil;
import com.whoiszxl.zhipin.im.cqrs.query.OfflineListQuery;
import com.whoiszxl.zhipin.im.pack.PrivateChatPack;
import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.protocol.Command;
import com.whoiszxl.zhipin.im.service.IGroupMessageService;
import com.whoiszxl.zhipin.im.service.IMessageContentService;
import com.whoiszxl.zhipin.im.service.ITalkService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.utils.RedisUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock
    private IMessageContentService messageContentService;

    @Mock
    private IGroupMessageService groupMessageService;

    @Mock
    private ITalkService talkService;

    @Mock
    private TokenHelper tokenHelper;

    @Mock
    private RedisUtils redisUtils;

    @InjectMocks
    private MessageServiceImpl messageService;

    @Test
    void listOfflineMessageReturnsOnlyMessagesAfterClientSequence() {
        OfflineListQuery query = new OfflineListQuery();
        query.setClientSequence("1");

        when(tokenHelper.getAppMemberId()).thenReturn(200L);
        when(redisUtils.zRangeByScore("offlineMessage:200", 1D)).thenReturn(new LinkedHashSet<>(Arrays.asList(
                offlineMessageJson(1L),
                offlineMessageJson(2L)
        )));

        List<ChatMessage> result = messageService.listOfflineMessage(query);

        assertThat(result).hasSize(1);
        assertThat(JSONUtil.toJsonStr(result.get(0))).contains("\"sequence\":2");
    }

    @Test
    void listOfflineMessageKeepsLargeSequenceAsStringCursor() {
        Long clientSequence = 1912345678901234567L;
        OfflineListQuery query = new OfflineListQuery();
        query.setClientSequence(String.valueOf(clientSequence));

        when(tokenHelper.getAppMemberId()).thenReturn(200L);
        when(redisUtils.zRangeByScore("offlineMessage:200", clientSequence.doubleValue())).thenReturn(new LinkedHashSet<>(Arrays.asList(
                offlineMessageJson(clientSequence),
                offlineMessageJson(clientSequence + 1)
        )));

        List<ChatMessage> result = messageService.listOfflineMessage(query);

        assertThat(result).hasSize(1);
        assertThat(JSONUtil.toJsonStr(result.get(0))).contains("\"sequence\":" + (clientSequence + 1));
    }

    private String offlineMessageJson(Long sequence) {
        PrivateChatPack pack = PrivateChatPack.builder()
                .messageId("msg-" + sequence)
                .contentId(String.valueOf(1000 + sequence))
                .fromMemberId(100L)
                .toMemberId(200L)
                .sequence(sequence)
                .body("hello-" + sequence)
                .build();

        return JSONUtil.toJsonStr(ChatMessage.builder()
                .toMemberId("200")
                .command(Command.MessageCommand.PRIVATE_CHAT)
                .clientType((byte) 1)
                .imei("imei-test")
                .data(pack)
                .sendAt("2026-06-16 15:00:00")
                .build());
    }
}
