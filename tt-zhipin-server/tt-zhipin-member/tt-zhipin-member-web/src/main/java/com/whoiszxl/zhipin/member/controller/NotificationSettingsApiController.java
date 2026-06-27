package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.NotificationSettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.NotificationSettingsResponse;
import com.whoiszxl.zhipin.member.service.INotificationSettingsService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "App notification settings API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notification")
public class NotificationSettingsApiController {

    private final INotificationSettingsService notificationSettingsService;

    @GetMapping("/settings")
    @Operation(summary = "Get current member notification settings")
    public ResponseResult<NotificationSettingsResponse> settings() {
        return ResponseResult.buildSuccess(notificationSettingsService.current());
    }

    @PostMapping("/settings/save")
    @Operation(summary = "Save current member notification settings")
    public ResponseResult<NotificationSettingsResponse> saveSettings(@RequestBody(required = false) NotificationSettingsSaveCommand command) {
        return ResponseResult.buildSuccess(notificationSettingsService.saveCurrent(command));
    }
}
