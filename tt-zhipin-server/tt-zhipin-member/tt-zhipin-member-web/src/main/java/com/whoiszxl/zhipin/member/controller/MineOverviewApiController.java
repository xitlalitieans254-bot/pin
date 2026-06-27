package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.response.BossMineOverviewResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeRefreshResponse;
import com.whoiszxl.zhipin.member.cqrs.response.WorkerMineOverviewResponse;
import com.whoiszxl.zhipin.member.service.IMineOverviewService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "App mine overview API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MineOverviewApiController {

    private final IMineOverviewService mineOverviewService;

    @GetMapping("/worker/mine/overview")
    @Operation(summary = "Get worker mine overview")
    public ResponseResult<WorkerMineOverviewResponse> workerOverview() {
        return ResponseResult.buildSuccess(mineOverviewService.workerOverview());
    }

    @GetMapping("/boss/mine/overview")
    @Operation(summary = "Get boss mine overview")
    public ResponseResult<BossMineOverviewResponse> bossOverview() {
        return ResponseResult.buildSuccess(mineOverviewService.bossOverview());
    }

    @PostMapping("/online/resume/refresh")
    @Operation(summary = "Refresh current member online resume")
    public ResponseResult<ResumeRefreshResponse> refreshResume() {
        return ResponseResult.buildSuccess(mineOverviewService.refreshResume());
    }
}
