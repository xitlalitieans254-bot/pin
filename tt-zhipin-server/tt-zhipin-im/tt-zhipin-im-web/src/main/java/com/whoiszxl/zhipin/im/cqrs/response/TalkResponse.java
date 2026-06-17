package com.whoiszxl.zhipin.im.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "会话列表返回实体")
public class TalkResponse {

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "会话类型: 1-单聊 2-群聊 3-ChatGPT 4-机器人")
    private Integer talkType;

    @Schema(description = "对方用户ID")
    private Long fromMemberId;

    @Schema(description = "对方用户信息 JSON")
    private String fromMemberInfo;

    @Schema(description = "当前用户ID")
    private Long toMemberId;

    @Schema(description = "静音状态: 0-未静音 1-已静音")
    private Integer muteStatus;

    @Schema(description = "置顶状态: 0-未置顶 1-已置顶")
    private Integer topStatus;

    @Schema(description = "已读序列号")
    private Long readSequence;

    @Schema(description = "序列号")
    private Long sequence;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;
}
