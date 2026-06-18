package com.whoiszxl.zhipin.member.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "Onboarding draft response")
public class OnboardingDraftResponse {

    private Long memberId;

    private String role;

    private String currentStep;

    private Integer currentStepIndex;

    private Map<String, Object> draft = new LinkedHashMap<>();
}
