package com.whoiszxl.zhipin.job.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.job.cqrs.query.AdminCompanyQuery;
import com.whoiszxl.zhipin.job.cqrs.response.AdminCompanyResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.LoginMember;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "后台企业管理")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/company")
public class AdminCompanyController {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int DISABLED_STATUS = 0;
    private static final int ENABLED_STATUS = 1;

    private final ICompanyService companyService;

    private final TokenHelper tokenHelper;

    @Operation(summary = "后台企业分页")
    @GetMapping("/page")
    public ResponseResult<PageResponse<AdminCompanyResponse>> page(@Validated AdminCompanyQuery query) {
        requireAdminLogin();
        normalizePageQuery(query);

        LambdaQueryWrapper<Company> wrapper = Wrappers.lambdaQuery();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            String keyword = StrUtil.trim(query.getKeyword());
            wrapper.and(item -> item
                    .like(Company::getCompanyFullName, keyword)
                    .or()
                    .like(Company::getCompanyAbbrName, keyword));
        }
        if (query.getStatus() != null) {
            wrapper.eq(Company::getStatus, query.getStatus());
        }
        if (StrUtil.isNotBlank(query.getIndustry())) {
            wrapper.eq(Company::getIndustry, StrUtil.trim(query.getIndustry()));
        }
        if (StrUtil.isNotBlank(query.getCity())) {
            wrapper.eq(Company::getCity, StrUtil.trim(query.getCity()));
        }
        wrapper.orderByDesc(Company::getUpdatedAt)
                .orderByDesc(Company::getCreatedAt)
                .orderByDesc(Company::getId);

        IPage<Company> page = companyService.page(query.toPage(), wrapper);
        return ResponseResult.buildSuccess(PageResponse.convert(page, AdminCompanyResponse.class));
    }

    @Operation(summary = "后台企业详情")
    @GetMapping("/{id}")
    public ResponseResult<AdminCompanyResponse> detail(@PathVariable Long id) {
        requireAdminLogin();
        Company company = companyService.getById(id);
        Assert.notNull(company, "企业不存在");
        return ResponseResult.buildSuccess(BeanUtil.copyProperties(company, AdminCompanyResponse.class));
    }

    @Operation(summary = "后台修改企业状态")
    @PatchMapping("/status/{id}")
    public ResponseResult<Boolean> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        requireAdminLogin();
        Assert.notNull(id, "企业ID不能为空");
        Assert.isTrue(status != null && (status == ENABLED_STATUS || status == DISABLED_STATUS), "企业状态不正确");

        boolean updated = companyService.update(Wrappers.<Company>lambdaUpdate()
                .eq(Company::getId, id)
                .set(Company::getStatus, status));
        Assert.isTrue(updated, "企业状态更新失败");
        return ResponseResult.buildSuccess(true);
    }

    private void normalizePageQuery(AdminCompanyQuery query) {
        if (query.getPage() == null) {
            query.setPage(FIRST_PAGE);
        }
        if (query.getSize() == null) {
            query.setSize(DEFAULT_PAGE_SIZE);
        }
    }

    private void requireAdminLogin() {
        Assert.isTrue(StpUtil.isLogin(), "请先登录后台");
        LoginMember loginMember = tokenHelper.getLoginMember();
        Assert.notNull(loginMember, "请先登录后台");
    }
}
