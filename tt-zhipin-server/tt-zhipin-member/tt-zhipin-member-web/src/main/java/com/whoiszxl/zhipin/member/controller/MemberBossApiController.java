package com.whoiszxl.zhipin.member.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.member.cqrs.command.BossMemberResumeDetailCommand;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.response.BossMemberResumeDetailResponse;
import com.whoiszxl.zhipin.member.cqrs.response.MemberRecommandResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.member.service.IOnlineResumeService;
import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Tag(name = "App boss member API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/boss/member")
public class MemberBossApiController {

    private static final int DISABLED = 0;

    private final IMemberService memberService;
    private final IMemberExpService memberExpService;
    private final IOnlineResumeService onlineResumeService;

    @Operation(summary = "Become boss")
    @GetMapping("/become-boss")
    public ResponseResult<Boolean> becomeBoss() {
        return ResponseResult.buildByFlag(memberService.becomeBoss());
    }

    @Operation(summary = "Get recommended member list")
    @PostMapping("/list")
    public ResponseResult<PageResponse<MemberRecommandResponse>> memberList(@RequestBody PageQuery pageQuery) {
        IPage<Member> page = memberService.page(pageQuery.toPage(), Wrappers.<Member>lambdaQuery()
                .eq(Member::getStatus, 1)
                .orderByDesc(Member::getUpdatedAt));

        PageResponse<MemberRecommandResponse> pageResponse = PageResponse.convert(page, MemberRecommandResponse.class);
        enrichResumeSummary(pageResponse.getList());
        return ResponseResult.buildSuccess(pageResponse);
    }

    @Operation(summary = "Get member full resume detail")
    @PostMapping("/resume/detail")
    public ResponseResult<BossMemberResumeDetailResponse> resumeDetail(@RequestBody BossMemberResumeDetailCommand command) {
        Assert.notNull(command, "request body is required");
        Assert.notNull(command.getMemberId(), "memberId is required");
        return ResponseResult.buildSuccess(onlineResumeService.bossDetail(command.getMemberId()));
    }

    private void enrichResumeSummary(List<MemberRecommandResponse> memberList) {
        if(CollUtil.isEmpty(memberList)) {
            return;
        }
        List<Long> memberIds = memberList.stream()
                .map(MemberRecommandResponse::getId)
                .collect(Collectors.toList());
        List<MemberExp> memberExpList = memberExpService.list(Wrappers.<MemberExp>lambdaQuery()
                .in(MemberExp::getMemberId, memberIds));
        if(CollUtil.isEmpty(memberExpList)) {
            return;
        }

        Map<Long, MemberExp> memberExpMap = memberExpList.stream()
                .collect(Collectors.toMap(MemberExp::getMemberId, Function.identity(), (left, right) -> left));
        for(MemberRecommandResponse response : memberList) {
            MemberExp memberExp = memberExpMap.get(response.getId());
            if(memberExp == null) {
                continue;
            }

            boolean visible = !Integer.valueOf(DISABLED).equals(memberExp.getStatus());
            response.setVisible(visible);
            if(!visible) {
                continue;
            }

            response.setAdvantage(StringUtils.defaultString(memberExp.getAdvantage()));
            response.setSummary(StringUtils.defaultString(memberExp.getAdvantage()));
            List<WorkExpectDto> workExpectList = workExpectList(memberExp.getWorkExpect());
            if(CollUtil.isEmpty(workExpectList)) {
                continue;
            }
            List<String> expectJobs = workExpectList.stream()
                    .map(WorkExpectDto::getJob)
                    .filter(StringUtils::isNotBlank)
                    .collect(Collectors.toList());
            response.setExpectJobs(expectJobs);
            if(CollUtil.isNotEmpty(expectJobs)) {
                response.setExpectJob(expectJobs.get(0));
            }
            WorkExpectDto first = workExpectList.get(0);
            response.setExpectCity(first.getCity());
            response.setSalaryRangeStart(first.getSalaryRangeStart());
            response.setSalaryRangeEnd(first.getSalaryRangeEnd());
        }
    }

    private List<WorkExpectDto> workExpectList(String workExpectJson) {
        if(StringUtils.isBlank(workExpectJson)) {
            return Collections.emptyList();
        }
        return JSONUtil.toList(workExpectJson, WorkExpectDto.class);
    }
}
