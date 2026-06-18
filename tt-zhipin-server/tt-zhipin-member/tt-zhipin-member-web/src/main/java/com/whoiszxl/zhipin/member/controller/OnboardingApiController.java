package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.OnboardingCompleteCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingDraftSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingRoleCommand;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingDraftResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingOptionsResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingStatusResponse;
import com.whoiszxl.zhipin.member.service.IOnboardingService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "C端新用户引导 API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/onboarding")
public class OnboardingApiController {

    private final IOnboardingService onboardingService;

    @GetMapping("/status")
    @Operation(summary = "Get current onboarding status")
    public ResponseResult<OnboardingStatusResponse> status() {
        return ResponseResult.buildSuccess(onboardingService.status());
    }

    @PostMapping("/role")
    @Operation(summary = "Choose onboarding role")
    public ResponseResult<OnboardingStatusResponse> chooseRole(@RequestBody @Validated OnboardingRoleCommand command) {
        return ResponseResult.buildSuccess(onboardingService.chooseRole(command));
    }

    @GetMapping("/draft")
    @Operation(summary = "Get onboarding draft")
    public ResponseResult<OnboardingDraftResponse> draft(@RequestParam String role) {
        return ResponseResult.buildSuccess(onboardingService.draft(role));
    }

    @PostMapping("/draft/save")
    @Operation(summary = "Save one onboarding step draft")
    public ResponseResult<OnboardingDraftResponse> saveDraft(@RequestBody @Validated OnboardingDraftSaveCommand command) {
        return ResponseResult.buildSuccess(onboardingService.saveDraft(command));
    }

    @PostMapping("/complete")
    @Operation(summary = "Complete onboarding flow")
    public ResponseResult<OnboardingStatusResponse> complete(@RequestBody @Validated OnboardingCompleteCommand command) {
        return ResponseResult.buildSuccess(onboardingService.complete(command));
    }

    @GetMapping("/options")
    @Operation(summary = "Get onboarding options")
    public ResponseResult<OnboardingOptionsResponse> options() {
        return ResponseResult.buildSuccess(onboardingService.options());
    }
}
