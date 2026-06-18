package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.Map;

@Data
@Schema(description = "Onboarding draft save command")
public class OnboardingDraftSaveCommand {

    @NotBlank(message = "role is required")
    @Schema(description = "JOBSEEKER or BOSS")
    private String role;

    @NotBlank(message = "stepKey is required")
    @Schema(description = "Step key, for example basic_info")
    private String stepKey;

    @Schema(description = "Step index in frontend flow")
    private Integer stepIndex;

    @Schema(description = "Current step payload")
    private Map<String, Object> stepData;
}
