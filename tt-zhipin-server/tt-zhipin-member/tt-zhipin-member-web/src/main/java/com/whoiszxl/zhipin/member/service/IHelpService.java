package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.response.HelpResponse;
import com.whoiszxl.zhipin.member.entity.MemberHelp;

import java.util.List;

public interface IHelpService extends IService<MemberHelp> {

    List<HelpResponse> listEnabled();
}
