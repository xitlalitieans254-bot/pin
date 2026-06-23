package com.whoiszxl.zhipin.im.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.whoiszxl.zhipin.im.cqrs.query.MessageHistoryQuery;
import com.whoiszxl.zhipin.im.cqrs.query.OfflineListQuery;
import com.whoiszxl.zhipin.im.cqrs.response.MessageHistoryResponse;
import com.whoiszxl.zhipin.im.entity.Message;
import com.whoiszxl.zhipin.im.entity.MessageContent;
import com.whoiszxl.zhipin.im.mapper.MessageMapper;
import com.whoiszxl.zhipin.im.pack.PrivateChatPack;
import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.protocol.Command;
import com.whoiszxl.zhipin.im.service.IGroupMessageService;
import com.whoiszxl.zhipin.im.service.IMessageContentService;
import com.whoiszxl.zhipin.im.service.ITalkService;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.utils.RedisUtils;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(Message.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, MessageMapper.class.getName()),
                Message.class);
        LambdaUtils.installCache(tableInfo);
    }

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

    @Spy
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

    @Test
    void listPrivateHistoryReturnsDatabaseMessagesForCurrentConversation() {
        MessageHistoryQuery query = new MessageHistoryQuery();
        query.setTargetMemberId(100L);

        Page<Message> messagePage = new Page<>(1, 20);
        messagePage.setRecords(Arrays.asList(
                historyMessage(2L, 200L, 100L, 1002L),
                historyMessage(1L, 100L, 200L, 1001L)
        ));
        messagePage.setTotal(2L);

        when(tokenHelper.getAppMemberId()).thenReturn(200L);
        doReturn(messagePage).when(messageService).page(any(), anyMessageWrapper());
        when(messageContentService.listByIds(anyCollection())).thenReturn(Arrays.asList(
                historyContent(1001L, "你好"),
                historyContent(1002L, "在的")
        ));

        PageResponse<MessageHistoryResponse> result = messageService.listPrivateHistory(query);

        assertThat(result.getTotal()).isEqualTo(2L);
        assertThat(result.getList()).hasSize(2);
        assertThat(result.getList().get(0).getSequence()).isEqualTo(1L);
        assertThat(result.getList().get(0).getMessageContent()).isEqualTo("你好");
        assertThat(result.getList().get(0).getMine()).isFalse();
        assertThat(result.getList().get(1).getSequence()).isEqualTo(2L);
        assertThat(result.getList().get(1).getMessageContent()).isEqualTo("在的");
        assertThat(result.getList().get(1).getMine()).isTrue();

        ArgumentCaptor<Wrapper<Message>> wrapperCaptor = messageWrapperCaptor();
        verify(messageService).page(any(), wrapperCaptor.capture());
        assertThat(wrapperCaptor.getValue().getSqlSegment())
                .contains("owner_id", "from_member_id", "to_member_id");
    }

    @Test
    void listPrivateHistoryRejectsSelfConversation() {
        MessageHistoryQuery query = new MessageHistoryQuery();
        query.setTargetMemberId(200L);

        when(tokenHelper.getAppMemberId()).thenReturn(200L);

        assertThatThrownBy(() -> messageService.listPrivateHistory(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("不能拉取自己的聊天历史");
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

    private Message historyMessage(Long sequence, Long fromMemberId, Long toMemberId, Long contentId) {
        Message message = new Message();
        message.setContentId(contentId);
        message.setFromMemberId(fromMemberId);
        message.setToMemberId(toMemberId);
        message.setOwnerId(200L);
        message.setMessageType(0);
        message.setSequence(sequence);
        message.setCreatedAt(LocalDateTime.of(2026, 6, 16, 15, 0).plusMinutes(sequence));
        return message;
    }

    private MessageContent historyContent(Long id, String body) {
        MessageContent content = new MessageContent();
        content.setId(id);
        content.setMessageContent(body);
        return content;
    }

    @SuppressWarnings("unchecked")
    private Wrapper<Message> anyMessageWrapper() {
        return any(Wrapper.class);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ArgumentCaptor<Wrapper<Message>> messageWrapperCaptor() {
        return ArgumentCaptor.forClass((Class) Wrapper.class);
    }
}
