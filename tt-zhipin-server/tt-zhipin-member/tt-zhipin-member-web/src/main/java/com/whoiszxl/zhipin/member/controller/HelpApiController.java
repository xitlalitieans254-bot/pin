package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.response.HelpResponse;
import com.whoiszxl.zhipin.member.service.IHelpService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "App help API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/help")
public class HelpApiController {

    private final IHelpService helpService;

    @GetMapping("/list")
    @Operation(summary = "List help items")
    public ResponseResult<List<HelpResponse>> list() {
        return ResponseResult.buildSuccess(helpService.listEnabled());
    }
}
