package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingCompleteCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingDraftSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingRoleCommand;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingDraftResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingOptionsResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingStatusResponse;
import com.whoiszxl.zhipin.member.entity.MemberOnboarding;

public interface IOnboardingService extends IService<MemberOnboarding> {

    OnboardingStatusResponse status();

    OnboardingStatusResponse chooseRole(OnboardingRoleCommand command);

    OnboardingDraftResponse draft(String role);

    OnboardingDraftResponse saveDraft(OnboardingDraftSaveCommand command);

    OnboardingStatusResponse complete(OnboardingCompleteCommand command);

    OnboardingOptionsResponse options();
}
