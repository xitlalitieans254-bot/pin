package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.response.HelpResponse;
import com.whoiszxl.zhipin.member.entity.MemberHelp;
import com.whoiszxl.zhipin.member.mapper.MemberHelpMapper;
import com.whoiszxl.zhipin.member.service.IHelpService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HelpServiceImpl extends ServiceImpl<MemberHelpMapper, MemberHelp> implements IHelpService {

    private static final int ENABLED_STATUS = 1;

    @Override
    public List<HelpResponse> listEnabled() {
        List<MemberHelp> helpList = this.list(Wrappers.<MemberHelp>lambdaQuery()
                .eq(MemberHelp::getStatus, ENABLED_STATUS)
                .orderByAsc(MemberHelp::getSort)
                .orderByAsc(MemberHelp::getId));
        if(helpList.isEmpty()) {
            return defaultHelpList();
        }
        return helpList.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private List<HelpResponse> defaultHelpList() {
        return Arrays.asList(
                help(1L, "account", "账号与登录", "如无法登录，请确认手机号和验证码是否正确；测试号可使用固定验证码。"),
                help(2L, "privacy", "隐私与屏蔽", "可在隐私设置中控制简历可见、联系方式隐藏、屏蔽公司等选项。"),
                help(3L, "job", "职位与沟通", "求职者可通过职位详情发起沟通，招聘方可在聊天中查看候选人信息。"),
                help(4L, "service", "反馈与客服", "遇到异常或体验问题，可提交反馈，平台会尽快处理。")
        );
    }

    private HelpResponse help(Long id, String category, String title, String content) {
        HelpResponse response = new HelpResponse();
        response.setId(id);
        response.setCategory(category);
        response.setTitle(title);
        response.setContent(content);
        return response;
    }

    private HelpResponse toResponse(MemberHelp help) {
        HelpResponse response = new HelpResponse();
        response.setId(help.getId());
        response.setCategory(help.getCategory());
        response.setTitle(help.getTitle());
        response.setContent(help.getContent());
        return response;
    }
}
