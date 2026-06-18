package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
@Schema(description = "Onboarding role select command")
public class OnboardingRoleCommand {

    @NotBlank(message = "role is required")
    @Schema(description = "JOBSEEKER or BOSS")
    private String role;
}
