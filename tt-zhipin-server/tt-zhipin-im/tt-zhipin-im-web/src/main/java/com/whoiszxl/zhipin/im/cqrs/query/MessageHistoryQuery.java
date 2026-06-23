package com.whoiszxl.zhipin.im.cqrs.query;

import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
@Schema(description = "私聊历史消息查询参数")
public class MessageHistoryQuery extends PageQuery {

    @NotNull(message = "会话对象不能为空")
    @Schema(description = "对方用户ID")
    private Long targetMemberId;

    @Schema(description = "向前翻页游标。传当前列表最早一条消息的 sequence，后端返回更早的消息")
    private String beforeSequence;
}
