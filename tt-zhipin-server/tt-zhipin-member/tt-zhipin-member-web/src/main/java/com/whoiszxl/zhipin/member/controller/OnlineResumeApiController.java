package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeBaseSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.ResumeVisibilityCommand;
import com.whoiszxl.zhipin.member.cqrs.response.OnlineResumeResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeVisibilityResponse;
import com.whoiszxl.zhipin.member.service.IOnlineResumeService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "App online resume API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/online/resume")
public class OnlineResumeApiController {

    private final IOnlineResumeService onlineResumeService;

    @PostMapping("/info")
    @Operation(summary = "Get current member online resume")
    public ResponseResult<OnlineResumeResponse> onlineResume() {
        return ResponseResult.buildSuccess(onlineResumeService.info());
    }

    @PostMapping("/save")
    @Operation(summary = "Save current member online resume")
    public ResponseResult<Boolean> save(@RequestBody OnlineResumeSaveCommand saveCommand) {
        return ResponseResult.buildSuccess(onlineResumeService.save(saveCommand));
    }

    @PostMapping("/base/save")
    @Operation(summary = "Save current member online resume base profile")
    public ResponseResult<Boolean> saveBase(@RequestBody OnlineResumeBaseSaveCommand saveCommand) {
        return ResponseResult.buildSuccess(onlineResumeService.saveBase(saveCommand));
    }

    @PostMapping("/visibility")
    @Operation(summary = "Update current member resume visibility")
    public ResponseResult<ResumeVisibilityResponse> updateVisibility(@RequestBody ResumeVisibilityCommand command) {
        return ResponseResult.buildSuccess(onlineResumeService.updateVisibility(command));
    }
}
