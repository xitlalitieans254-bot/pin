package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Boss member resume detail command")
public class BossMemberResumeDetailCommand {

    @Schema(description = "Jobseeker member id")
    private Long memberId;
}
