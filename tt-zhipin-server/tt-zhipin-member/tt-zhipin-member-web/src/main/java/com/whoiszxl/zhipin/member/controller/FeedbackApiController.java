package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.FeedbackSubmitCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.service.IFeedbackService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "App feedback API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/feedback")
public class FeedbackApiController {

    private final IFeedbackService feedbackService;

    @PostMapping("/submit")
    @Operation(summary = "Submit feedback")
    public ResponseResult<SubmitResultResponse> submit(@RequestBody FeedbackSubmitCommand command) {
        return ResponseResult.buildSuccess(feedbackService.submit(command));
    }
}
