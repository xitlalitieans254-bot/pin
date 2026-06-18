package com.whoiszxl.zhipin.member.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "Onboarding status response")
public class OnboardingStatusResponse {

    private Long memberId;

    @Schema(description = "JOBSEEKER or BOSS")
    private String role;

    private String currentStep;

    private Integer currentStepIndex;

    private Boolean jobseekerCompleted = false;

    private Boolean bossCompleted = false;

    @Schema(description = "ROLE_SELECT, JOBSEEKER_ONBOARDING, BOSS_ONBOARDING, JOBSEEKER_HOME, BOSS_HOME")
    private String nextPage;

    @Schema(description = "Draft for selected role")
    private Map<String, Object> draft = new LinkedHashMap<>();
}
