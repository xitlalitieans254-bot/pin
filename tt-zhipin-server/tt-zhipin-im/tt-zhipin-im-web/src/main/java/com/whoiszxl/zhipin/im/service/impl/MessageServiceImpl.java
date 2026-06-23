package com.whoiszxl.zhipin.im.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.IdUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.im.constants.TalkTypeEnum;
import com.whoiszxl.zhipin.im.cqrs.command.TalkAddCommand;
import com.whoiszxl.zhipin.im.cqrs.query.MessageHistoryQuery;
import com.whoiszxl.zhipin.im.cqrs.query.OfflineListQuery;
import com.whoiszxl.zhipin.im.cqrs.response.MessageHistoryResponse;
import com.whoiszxl.zhipin.im.entity.GroupMessage;
import com.whoiszxl.zhipin.im.entity.Message;
import com.whoiszxl.zhipin.im.entity.MessageContent;
import com.whoiszxl.zhipin.im.entity.Talk;
import com.whoiszxl.zhipin.im.mapper.MessageMapper;
import com.whoiszxl.zhipin.im.pack.GroupChatPack;
import com.whoiszxl.zhipin.im.pack.MessagePack;
import com.whoiszxl.zhipin.im.pack.PrivateChatPack;
import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.service.IGroupMessageService;
import com.whoiszxl.zhipin.im.service.IMessageContentService;
import com.whoiszxl.zhipin.im.service.IMessageService;
import com.whoiszxl.zhipin.im.service.ITalkService;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.utils.RedisUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * <p>
 * 消息表 服务实现类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-17
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MessageServiceImpl extends ServiceImpl<MessageMapper, Message> implements IMessageService {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_HISTORY_PAGE_SIZE = 20;

    private final IMessageContentService messageContentService;

    private final IGroupMessageService groupMessageService;

    private final ITalkService talkService;

    private final TokenHelper tokenHelper;

    private final RedisUtils redisUtils;

    @Value("${im.offlineMessageMaxCount}")
    private Integer offlineMessageMaxCount;

    @Override
    @Transactional
    public Long savePrivateChatMessage(MessagePack messagePack) {
        PrivateChatPack privateChatPack = (PrivateChatPack) messagePack.getDataPack();

        //判断是否存在聊天框，不存在则创建
        Talk talk = talkService.getOne(Wrappers.<Talk>lambdaQuery()
                .eq(Talk::getFromMemberId, privateChatPack.getFromMemberId())
                .eq(Talk::getToMemberId, privateChatPack.getToMemberId()));
        if(talk == null) {
            talkService.add(TalkAddCommand.builder()
                    .fromMemberId(privateChatPack.getFromMemberId())
                    .toMemberId(privateChatPack.getToMemberId())
                    .talkType(TalkTypeEnum.PRIVATE_CHAT.getCode())
                    .build());
        }


        // 消息体持久化
        long contentId = IdUtil.getSnowflakeNextId();
        MessageContent messageContent = new MessageContent();
        messageContent.setId(contentId);
        messageContent.setMessageContent(privateChatPack.getBody());
        messageContentService.save(messageContent);

        //消息记录持久化
        Message messageOne = buildPrivateMessage(privateChatPack.getFromMemberId(), privateChatPack, contentId);
        Message messageTwo = buildPrivateMessage(privateChatPack.getToMemberId(), privateChatPack, contentId);
        this.saveBatch(CollUtil.newArrayList(messageOne, messageTwo));

        return contentId;
    }

    private Message buildPrivateMessage(Long ownerId, PrivateChatPack privateChatPack, Long contentId) {
        Message message = new Message();
        message.setContentId(contentId);
        message.setFromMemberId(privateChatPack.getFromMemberId());
        message.setToMemberId(privateChatPack.getToMemberId());
        message.setOwnerId(ownerId);
        message.setMessageType(0); //TODO 待实现图片类型、语音类型
        message.setSequence(privateChatPack.getSequence());
        return message;
    }


    @Override
    public void saveGroupChatMessage(MessagePack messagePack) {
        GroupChatPack groupChatPack = (GroupChatPack) messagePack.getDataPack();

        // 消息体持久化
        long contentId = IdUtil.getSnowflakeNextId();
        MessageContent messageContent = new MessageContent();
        messageContent.setId(contentId);
        messageContent.setMessageContent(groupChatPack.getBody());
        messageContentService.save(messageContent);

        //消息记录持久化
        GroupMessage groupMessage = buildGroupMessage(groupChatPack, contentId);
        groupMessageService.save(groupMessage);

    }

    @Override
    public void saveOfflineMessage(MessagePack messagePack, Long contentId) {
        PrivateChatPack privateChatPack = (PrivateChatPack) messagePack.getDataPack();

        ChatMessage<Object> chatMessage = ChatMessage.builder()
                .toMemberId(String.valueOf(privateChatPack.getToMemberId()))
                .command(privateChatPack.getCommand())
                .clientType((byte) 0)
                .imei("todo")
                .data(privateChatPack)
                .sendAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .build();

        String key = String.format("%s:%s", "offlineMessage", privateChatPack.getToMemberId());
        Long size = redisUtils.zSize(key);
        if(size > offlineMessageMaxCount) {
            redisUtils.zRemoveRange(key, 0, 0);
        }

        redisUtils.zAdd(key, JSONUtil.toJsonStr(chatMessage), privateChatPack.getSequence());
    }

    @Override
    public List<ChatMessage> listOfflineMessage(OfflineListQuery query) {
        Long clientSequence = parseClientSequence(query.getClientSequence());
        String key = String.format("%s:%s", "offlineMessage", tokenHelper.getAppMemberId());
        Set<String> setList = redisUtils.zRangeByScore(key, clientSequence.doubleValue());
        List<ChatMessage> chatMessages = new ArrayList<>();
        for (String s : setList) {
            ChatMessage chatMessage = JSONUtil.toBean(s, ChatMessage.class);
            Long messageSequence = resolveMessageSequence(chatMessage);
            if (messageSequence == null || messageSequence > clientSequence) {
                chatMessages.add(chatMessage);
            }
        }
        return chatMessages;
    }

    @Override
    public PageResponse<MessageHistoryResponse> listPrivateHistory(MessageHistoryQuery query) {
        Assert.notNull(query, "请求参数不能为空");
        normalizeHistoryQuery(query);
        Long currentMemberId = tokenHelper.getAppMemberId();
        Long targetMemberId = query.getTargetMemberId();
        Assert.notNull(currentMemberId, "当前登录用户不能为空");
        Assert.notNull(targetMemberId, "会话对象不能为空");
        Assert.isTrue(!Objects.equals(currentMemberId, targetMemberId), "不能拉取自己的聊天历史");

        Long beforeSequence = parseOptionalSequence(query.getBeforeSequence(), "历史消息游标不正确");
        IPage<Message> messagePage = this.page(query.toPage(), Wrappers.<Message>lambdaQuery()
                .eq(Message::getOwnerId, currentMemberId)
                .and(wrapper -> wrapper
                        .eq(Message::getFromMemberId, currentMemberId)
                        .eq(Message::getToMemberId, targetMemberId)
                        .or()
                        .eq(Message::getFromMemberId, targetMemberId)
                        .eq(Message::getToMemberId, currentMemberId))
                .lt(beforeSequence != null, Message::getSequence, beforeSequence)
                .orderByDesc(Message::getSequence)
                .orderByDesc(Message::getCreatedAt));

        List<Message> messages = messagePage.getRecords() == null
                ? new ArrayList<>()
                : new ArrayList<>(messagePage.getRecords());
        Collections.reverse(messages);

        Map<Long, MessageContent> contentMap = contentMap(messages);
        List<MessageHistoryResponse> historyList = messages.stream()
                .map(message -> toHistoryResponse(message, contentMap.get(message.getContentId()), currentMemberId))
                .collect(Collectors.toList());

        PageResponse<MessageHistoryResponse> response = new PageResponse<>();
        response.setList(historyList);
        response.setTotal(messagePage.getTotal());
        return response;
    }

    private Long parseClientSequence(String clientSequence) {
        if (clientSequence == null || clientSequence.trim().isEmpty()) {
            return 0L;
        }
        try {
            return Long.parseLong(clientSequence);
        } catch (NumberFormatException e) {
            log.warn("invalid offline message client sequence: {}", clientSequence);
            return 0L;
        }
    }

    private Long resolveMessageSequence(ChatMessage chatMessage) {
        if (chatMessage == null || chatMessage.getData() == null) {
            return null;
        }

        Object data = chatMessage.getData();
        if (data instanceof PrivateChatPack) {
            return ((PrivateChatPack) data).getSequence();
        }
        if (data instanceof JSONObject) {
            return ((JSONObject) data).getLong("sequence");
        }
        if (data instanceof Map) {
            return toLong(((Map) data).get("sequence"));
        }
        if (data instanceof CharSequence) {
            return JSONUtil.parseObj(data).getLong("sequence");
        }
        return null;
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private void normalizeHistoryQuery(MessageHistoryQuery query) {
        if(query.getPage() == null) {
            query.setPage(FIRST_PAGE);
        }
        if(query.getSize() == null) {
            query.setSize(DEFAULT_HISTORY_PAGE_SIZE);
        }
    }

    private Long parseOptionalSequence(String sequence, String errorMessage) {
        if(sequence == null || sequence.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(sequence);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private Map<Long, MessageContent> contentMap(List<Message> messages) {
        if(CollUtil.isEmpty(messages)) {
            return Collections.emptyMap();
        }
        List<Long> contentIds = messages.stream()
                .map(Message::getContentId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if(CollUtil.isEmpty(contentIds)) {
            return Collections.emptyMap();
        }
        List<MessageContent> contentList = messageContentService.listByIds(contentIds);
        if(CollUtil.isEmpty(contentList)) {
            return Collections.emptyMap();
        }
        return contentList.stream()
                .collect(Collectors.toMap(MessageContent::getId, content -> content, (left, right) -> left));
    }

    private MessageHistoryResponse toHistoryResponse(Message message, MessageContent content, Long currentMemberId) {
        MessageHistoryResponse response = new MessageHistoryResponse();
        response.setContentId(message.getContentId());
        response.setFromMemberId(message.getFromMemberId());
        response.setToMemberId(message.getToMemberId());
        response.setOwnerId(message.getOwnerId());
        response.setMessageType(message.getMessageType());
        response.setSequence(message.getSequence());
        response.setCreatedAt(message.getCreatedAt());
        response.setMine(Objects.equals(message.getFromMemberId(), currentMemberId));
        if(content != null) {
            response.setMessageContent(content.getMessageContent());
            response.setExtra(content.getExtra());
        }
        return response;
    }

    private GroupMessage buildGroupMessage(GroupChatPack groupChatPack, long contentId) {
        GroupMessage groupMessage = new GroupMessage();
        groupMessage.setId(IdUtil.getSnowflakeNextId());
        groupMessage.setGroupId(groupChatPack.getGroupId());
        groupMessage.setContentId(contentId);
        groupMessage.setOwnerMemberId(groupChatPack.getFromMemberId());
        groupMessage.setMessageType(0);  //TODO 待实现图片类型、语音类型
        groupMessage.setSequence(groupChatPack.getSequence());
        return groupMessage;
    }
}
