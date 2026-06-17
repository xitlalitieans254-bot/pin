package com.whoiszxl.zhipin.job.controller;


import com.whoiszxl.zhipin.job.cqrs.command.CompanySaveCommand;
import com.whoiszxl.zhipin.job.cqrs.response.CompanyResponse;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 公司表 前端控制器
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-09
 */
@Tag(name = "C端: 公司 API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/company")
public class CompanyController {

    private final ICompanyService companyService;

    @Operation(summary = "招聘方获取我的企业资料", description = "获取当前登录招聘方的企业资料")
    @GetMapping("/my")
    public ResponseResult<CompanyResponse> myCompany() {
        return ResponseResult.buildSuccess(companyService.myCompany());
    }

    @Operation(summary = "招聘方保存我的企业资料", description = "新增或更新当前登录招聘方的企业资料")
    @PostMapping("/my/save")
    public ResponseResult<CompanyResponse> saveMyCompany(@RequestBody @Validated CompanySaveCommand command) {
        return ResponseResult.buildSuccess(companyService.saveMyCompany(command));
    }
}
