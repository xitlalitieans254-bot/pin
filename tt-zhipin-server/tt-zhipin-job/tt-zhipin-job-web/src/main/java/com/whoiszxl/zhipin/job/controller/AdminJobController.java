package com.whoiszxl.zhipin.job.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.job.cqrs.query.AdminJobQuery;
import com.whoiszxl.zhipin.job.cqrs.response.AdminJobResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.entity.Job;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.job.service.IJobService;
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

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Tag(name = "后台职位管理")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/job")
public class AdminJobController {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int OFFLINE_STATUS = 0;
    private static final int ONLINE_STATUS = 1;

    private final IJobService jobService;

    private final ICompanyService companyService;

    private final TokenHelper tokenHelper;

    @Operation(summary = "后台职位分页")
    @GetMapping("/page")
    public ResponseResult<PageResponse<AdminJobResponse>> page(@Validated AdminJobQuery query) {
        requireAdminLogin();
        normalizePageQuery(query);

        LambdaQueryWrapper<Job> wrapper = Wrappers.lambdaQuery();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            String keyword = StrUtil.trim(query.getKeyword());
            wrapper.and(item -> item
                    .like(Job::getJobName, keyword)
                    .or()
                    .like(Job::getJobDescription, keyword)
                    .or()
                    .like(Job::getCity, keyword)
                    .or()
                    .like(Job::getAddressDetail, keyword));
        }
        if (query.getStatus() != null) {
            wrapper.eq(Job::getStatus, query.getStatus());
        }
        if (query.getCompanyId() != null) {
            wrapper.eq(Job::getCompanyId, query.getCompanyId());
        }
        if (StrUtil.isNotBlank(query.getCity())) {
            wrapper.eq(Job::getCity, StrUtil.trim(query.getCity()));
        }
        wrapper.orderByDesc(Job::getUpdatedAt)
                .orderByDesc(Job::getCreatedAt)
                .orderByDesc(Job::getId);

        IPage<Job> page = jobService.page(query.toPage(), wrapper);
        PageResponse<AdminJobResponse> response = PageResponse.convert(page, AdminJobResponse.class);
        fillCompanyInfo(response);
        return ResponseResult.buildSuccess(response);
    }

    @Operation(summary = "后台职位详情")
    @GetMapping("/{id}")
    public ResponseResult<AdminJobResponse> detail(@PathVariable Long id) {
        requireAdminLogin();
        Job job = jobService.getById(id);
        Assert.notNull(job, "职位不存在");
        AdminJobResponse response = BeanUtil.copyProperties(job, AdminJobResponse.class);
        fillCompanyInfo(response);
        return ResponseResult.buildSuccess(response);
    }

    @Operation(summary = "后台修改职位状态")
    @PatchMapping("/status/{id}")
    public ResponseResult<Boolean> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        requireAdminLogin();
        Assert.notNull(id, "职位ID不能为空");
        Assert.isTrue(status != null && (status == ONLINE_STATUS || status == OFFLINE_STATUS), "职位状态不正确");

        boolean updated = jobService.update(Wrappers.<Job>lambdaUpdate()
                .eq(Job::getId, id)
                .set(Job::getStatus, status));
        Assert.isTrue(updated, "职位状态更新失败");
        return ResponseResult.buildSuccess(true);
    }

    private void fillCompanyInfo(PageResponse<AdminJobResponse> response) {
        if (response == null || CollUtil.isEmpty(response.getList())) {
            return;
        }
        List<Long> companyIds = response.getList().stream()
                .map(AdminJobResponse::getCompanyId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (CollUtil.isEmpty(companyIds)) {
            return;
        }
        Map<Long, Company> companyMap = companyService.listByIds(companyIds).stream()
                .collect(Collectors.toMap(Company::getId, company -> company, (left, right) -> left));
        response.getList().forEach(item -> fillCompanyInfo(item, companyMap.get(item.getCompanyId())));
    }

    private void fillCompanyInfo(AdminJobResponse response) {
        if (response == null || response.getCompanyId() == null) {
            return;
        }
        fillCompanyInfo(response, companyService.getById(response.getCompanyId()));
    }

    private void fillCompanyInfo(AdminJobResponse response, Company company) {
        if (response == null || company == null) {
            return;
        }
        response.setCompanyFullName(company.getCompanyFullName());
        response.setCompanyAbbrName(company.getCompanyAbbrName());
    }

    private void normalizePageQuery(AdminJobQuery query) {
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
