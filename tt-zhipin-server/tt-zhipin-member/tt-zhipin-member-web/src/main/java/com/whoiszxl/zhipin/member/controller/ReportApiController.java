package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.ReportSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.service.IMemberReportService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "App report API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/report")
public class ReportApiController {

    private final IMemberReportService memberReportService;

    @PostMapping("/submit")
    @Operation(summary = "Submit report")
    public ResponseResult<SubmitResultResponse> submit(@RequestBody ReportSubmitCommand command) {
        return ResponseResult.buildSuccess(memberReportService.submit(command));
    }
}
