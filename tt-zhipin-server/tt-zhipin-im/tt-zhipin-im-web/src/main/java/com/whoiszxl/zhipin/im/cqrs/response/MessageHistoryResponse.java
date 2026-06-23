package com.whoiszxl.zhipin.im.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "私聊历史消息")
public class MessageHistoryResponse {

    @Schema(description = "消息内容ID")
    private Long contentId;

    @Schema(description = "发送用户ID")
    private Long fromMemberId;

    @Schema(description = "接收用户ID")
    private Long toMemberId;

    @Schema(description = "消息所属用户ID")
    private Long ownerId;

    @Schema(description = "消息类型")
    private Integer messageType;

    @Schema(description = "消息序列号")
    private Long sequence;

    @Schema(description = "消息内容")
    private String messageContent;

    @Schema(description = "扩展信息")
    private String extra;

    @Schema(description = "是否为当前登录用户发送")
    private Boolean mine;

    @Schema(description = "消息创建时间")
    private LocalDateTime createdAt;
}
