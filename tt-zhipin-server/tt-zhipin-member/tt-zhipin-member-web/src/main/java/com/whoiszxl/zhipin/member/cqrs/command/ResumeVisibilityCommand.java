package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Resume visibility command")
public class ResumeVisibilityCommand {

    @Schema(description = "Whether resume is visible to boss")
    private Boolean visible;
}
