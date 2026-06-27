package com.whoiszxl.zhipin.member.controller;

import com.whoiszxl.zhipin.member.cqrs.command.CompanyBlockCommand;
import com.whoiszxl.zhipin.member.cqrs.command.PrivacySettingsSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.response.CompanyBlockResponse;
import com.whoiszxl.zhipin.member.cqrs.response.PrivacySettingsResponse;
import com.whoiszxl.zhipin.member.service.IMemberCompanyBlockService;
import com.whoiszxl.zhipin.member.service.IPrivacySettingsService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "App privacy settings API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/privacy")
public class PrivacySettingsApiController {

    private final IPrivacySettingsService privacySettingsService;

    private final IMemberCompanyBlockService memberCompanyBlockService;

    @GetMapping("/settings")
    @Operation(summary = "Get current member privacy settings")
    public ResponseResult<PrivacySettingsResponse> settings() {
        return ResponseResult.buildSuccess(privacySettingsService.current());
    }

    @PostMapping("/settings/save")
    @Operation(summary = "Save current member privacy settings")
    public ResponseResult<PrivacySettingsResponse> saveSettings(@RequestBody(required = false) PrivacySettingsSaveCommand command) {
        return ResponseResult.buildSuccess(privacySettingsService.saveCurrent(command));
    }

    @GetMapping("/company-block/list")
    @Operation(summary = "List current member blocked companies")
    public ResponseResult<List<CompanyBlockResponse>> listCompanyBlock() {
        return ResponseResult.buildSuccess(memberCompanyBlockService.listCurrent());
    }

    @PostMapping("/company-block/add")
    @Operation(summary = "Add blocked company")
    public ResponseResult<Boolean> addCompanyBlock(@RequestBody CompanyBlockCommand command) {
        return ResponseResult.buildSuccess(memberCompanyBlockService.addCurrent(command));
    }

    @PostMapping("/company-block/delete")
    @Operation(summary = "Delete blocked company")
    public ResponseResult<Boolean> deleteCompanyBlock(@RequestBody CompanyBlockCommand command) {
        return ResponseResult.buildSuccess(memberCompanyBlockService.deleteCurrent(command));
    }
}
