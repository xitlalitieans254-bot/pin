package com.whoiszxl.zhipin.im.controller;

import com.whoiszxl.zhipin.im.cqrs.command.TalkAddCommand;
import com.whoiszxl.zhipin.im.cqrs.command.TalkDeleteCommand;
import com.whoiszxl.zhipin.im.cqrs.query.TalkQuery;
import com.whoiszxl.zhipin.im.cqrs.response.TalkResponse;
import com.whoiszxl.zhipin.im.service.ITalkService;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "IM 会话 API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/talk")
public class TalkController {

    private final ITalkService talkService;

    @GetMapping("/list")
    @Operation(summary = "获取会话列表", description = "获取当前登录用户的会话列表")
    public ResponseResult<PageResponse<TalkResponse>> list(@Validated TalkQuery talkQuery) {
        PageResponse<TalkResponse> pageResponse = talkService.talkList(talkQuery);
        return ResponseResult.buildSuccess(pageResponse);
    }

    @PostMapping("/add")
    @Operation(summary = "添加会话", description = "兼容旧接口，内部会创建或复用当前登录用户与目标用户之间的私聊会话")
    public ResponseResult<Boolean> add(@Validated @RequestBody TalkAddCommand command) {
        Boolean flag = talkService.add(command);
        return ResponseResult.buildByFlag(flag);
    }

    @PostMapping("/private/ensure")
    @Operation(summary = "创建或复用私聊会话", description = "点击立即沟通前调用，返回当前登录用户视角的会话信息")
    public ResponseResult<TalkResponse> ensurePrivateTalk(@Validated @RequestBody TalkAddCommand command) {
        return ResponseResult.buildSuccess(talkService.ensurePrivateTalk(command));
    }

    @PostMapping("/delete")
    @Operation(summary = "删除会话", description = "删除当前登录用户自己的会话")
    public ResponseResult<Boolean> delete(@Validated @RequestBody TalkDeleteCommand command) {
        Boolean flag = talkService.delete(command);
        return ResponseResult.buildByFlag(flag);
    }
}
