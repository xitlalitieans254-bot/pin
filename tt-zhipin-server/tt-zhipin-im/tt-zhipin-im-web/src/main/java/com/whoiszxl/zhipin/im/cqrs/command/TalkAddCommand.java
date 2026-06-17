package com.whoiszxl.zhipin.im.cqrs.command;

import com.whoiszxl.zhipin.im.entity.BaseRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "会话添加命令")
public class TalkAddCommand extends BaseRequest {

    @Schema(description = "会话类型: 1-单聊 2-群聊 3-ChatGPT 4-机器人")
    private Integer talkType;

    @Schema(description = "发送会话的用户ID，兼容旧接口，新逻辑以登录态为准")
    private Long fromMemberId;

    @NotNull(message = "接收会话的用户ID不能为空")
    @Schema(description = "接收会话的用户ID")
    private Long toMemberId;
}
