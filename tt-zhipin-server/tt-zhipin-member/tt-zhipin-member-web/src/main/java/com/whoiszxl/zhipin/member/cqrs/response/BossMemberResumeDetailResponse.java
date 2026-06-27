package com.whoiszxl.zhipin.member.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "Boss view of member resume detail")
public class BossMemberResumeDetailResponse extends OnlineResumeResponse {

    @Schema(description = "Whether current boss can chat with this member")
    private Boolean canChat = true;

    @Schema(description = "Last active time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime lastActiveTime;
}
