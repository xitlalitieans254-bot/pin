package com.whoiszxl.zhipin.member.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resume visibility response")
public class ResumeVisibilityResponse {

    @Schema(description = "Whether resume is visible to boss")
    private Boolean visible;
}
