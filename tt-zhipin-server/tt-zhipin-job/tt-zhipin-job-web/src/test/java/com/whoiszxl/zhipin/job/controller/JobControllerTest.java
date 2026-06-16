package com.whoiszxl.zhipin.job.controller;

import com.whoiszxl.zhipin.job.cqrs.query.JobQuery;
import com.whoiszxl.zhipin.job.cqrs.response.JobResponse;
import com.whoiszxl.zhipin.job.service.IJobService;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobControllerTest {

    @Mock
    private IJobService jobService;

    @InjectMocks
    private JobController jobController;

    @Test
    void recommendEndpointUsesRecommendList() {
        JobQuery query = new JobQuery();
        PageResponse<JobResponse> pageResponse = new PageResponse<>();
        when(jobService.recommendList(query)).thenReturn(pageResponse);

        jobController.recommendList(query);

        verify(jobService).recommendList(query);
        verify(jobService, never()).latestList(query);
    }

    @Test
    void nearbyEndpointUsesNearbyList() {
        JobQuery query = new JobQuery();
        PageResponse<JobResponse> pageResponse = new PageResponse<>();
        when(jobService.nearbyList(query)).thenReturn(pageResponse);

        jobController.nearbyList(query);

        verify(jobService).nearbyList(query);
        verify(jobService, never()).latestList(query);
    }
}
