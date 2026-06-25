package com.whoiszxl.zhipin.member.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.member.cqrs.query.AdminMemberQuery;
import com.whoiszxl.zhipin.member.cqrs.response.AdminMemberResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.service.IMemberService;
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

@Tag(name = "后台会员管理")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/member")
public class AdminMemberController {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int DISABLED_STATUS = 0;
    private static final int ENABLED_STATUS = 1;

    private final IMemberService memberService;

    private final TokenHelper tokenHelper;

    @Operation(summary = "后台会员分页")
    @GetMapping("/page")
    public ResponseResult<PageResponse<AdminMemberResponse>> page(@Validated AdminMemberQuery query) {
        requireAdminLogin();
        normalizePageQuery(query);

        LambdaQueryWrapper<Member> wrapper = Wrappers.lambdaQuery();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            String keyword = StrUtil.trim(query.getKeyword());
            wrapper.and(item -> item
                    .like(Member::getPhone, keyword)
                    .or()
                    .like(Member::getFullName, keyword)
                    .or()
                    .like(Member::getEmail, keyword));
        }
        if (query.getStatus() != null) {
            wrapper.eq(Member::getStatus, query.getStatus());
        }
        if (query.getIdentityStatus() != null) {
            wrapper.eq(Member::getIdentityStatus, query.getIdentityStatus());
        }
        if (query.getIsToutou() != null) {
            wrapper.eq(Member::getIsToutou, query.getIsToutou());
        }
        wrapper.orderByDesc(Member::getUpdatedAt)
                .orderByDesc(Member::getCreatedAt)
                .orderByDesc(Member::getId);

        IPage<Member> page = memberService.page(query.toPage(), wrapper);
        return ResponseResult.buildSuccess(PageResponse.convert(page, AdminMemberResponse.class));
    }

    @Operation(summary = "后台会员详情")
    @GetMapping("/{id}")
    public ResponseResult<AdminMemberResponse> detail(@PathVariable Long id) {
        requireAdminLogin();
        Member member = memberService.getById(id);
        Assert.notNull(member, "用户不存在");
        return ResponseResult.buildSuccess(cn.hutool.core.bean.BeanUtil.copyProperties(member, AdminMemberResponse.class));
    }

    @Operation(summary = "后台修改会员状态")
    @PatchMapping("/status/{id}")
    public ResponseResult<Boolean> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        requireAdminLogin();
        Assert.notNull(id, "用户ID不能为空");
        Assert.isTrue(status != null && (status == ENABLED_STATUS || status == DISABLED_STATUS), "用户状态不正确");

        boolean updated = memberService.update(Wrappers.<Member>lambdaUpdate()
                .eq(Member::getId, id)
                .set(Member::getStatus, status));
        Assert.isTrue(updated, "用户状态更新失败");
        return ResponseResult.buildSuccess(true);
    }

    private void normalizePageQuery(AdminMemberQuery query) {
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
