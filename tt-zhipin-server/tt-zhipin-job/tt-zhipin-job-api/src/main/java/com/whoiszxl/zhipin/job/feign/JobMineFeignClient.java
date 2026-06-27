package com.whoiszxl.zhipin.job.feign;

import com.whoiszxl.zhipin.job.cqrs.response.BossMineJobOverviewResponse;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.feign.FeignTokenConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "tt-zhipin-job", contextId = "jobMineFeign", configuration = FeignTokenConfig.class)
public interface JobMineFeignClient {

    @GetMapping("/internal/boss/mine/overview")
    ResponseResult<BossMineJobOverviewResponse> bossMineOverview();
}
