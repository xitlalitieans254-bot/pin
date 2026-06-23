package com.whoiszxl.zhipin.im.controller;


import com.whoiszxl.zhipin.im.cqrs.query.OfflineListQuery;
import com.whoiszxl.zhipin.im.cqrs.query.MessageHistoryQuery;
import com.whoiszxl.zhipin.im.cqrs.response.MessageHistoryResponse;
import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.service.IMessageService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 消息表 前端控制器
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-17
 */
@Tag(name = "IM消息 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/message")
public class MessageController {

    private final IMessageService messageService;

    @PostMapping("/offline/list")
    @Operation(summary = "获取离线消息列表", description = "messageService")
    public ResponseResult<List<ChatMessage>> offlineList(@RequestBody OfflineListQuery query) {
        List<ChatMessage> result = messageService.listOfflineMessage(query);
        return ResponseResult.buildSuccess(result);
    }

    @PostMapping("/history/list")
    @Operation(summary = "获取私聊历史消息列表", description = "从数据库按会话拉取历史消息，用于换手机、重装、清缓存后的聊天记录恢复")
    public ResponseResult<PageResponse<MessageHistoryResponse>> historyList(@RequestBody @Validated MessageHistoryQuery query) {
        return ResponseResult.buildSuccess(messageService.listPrivateHistory(query));
    }
}

