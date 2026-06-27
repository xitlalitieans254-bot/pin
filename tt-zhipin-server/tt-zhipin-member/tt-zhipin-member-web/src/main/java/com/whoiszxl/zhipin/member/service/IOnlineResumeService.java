package com.whoiszxl.zhipin.member.service;

import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeBaseSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnlineResumeSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.ResumeVisibilityCommand;
import com.whoiszxl.zhipin.member.cqrs.response.BossMemberResumeDetailResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnlineResumeResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeVisibilityResponse;

public interface IOnlineResumeService {

    OnlineResumeResponse info();

    boolean save(OnlineResumeSaveCommand saveCommand);

    boolean saveBase(OnlineResumeBaseSaveCommand saveCommand);

    ResumeVisibilityResponse updateVisibility(ResumeVisibilityCommand command);

    BossMemberResumeDetailResponse bossDetail(Long memberId);
}
