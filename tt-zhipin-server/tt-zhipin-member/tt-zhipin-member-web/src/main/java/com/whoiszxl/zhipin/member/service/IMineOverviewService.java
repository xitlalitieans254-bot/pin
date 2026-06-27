package com.whoiszxl.zhipin.member.service;

import com.whoiszxl.zhipin.member.cqrs.response.BossMineOverviewResponse;
import com.whoiszxl.zhipin.member.cqrs.response.ResumeRefreshResponse;
import com.whoiszxl.zhipin.member.cqrs.response.WorkerMineOverviewResponse;

public interface IMineOverviewService {

    WorkerMineOverviewResponse workerOverview();

    BossMineOverviewResponse bossOverview();

    ResumeRefreshResponse refreshResume();
}
