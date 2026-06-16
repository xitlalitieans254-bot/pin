package com.whoiszxl.zhipin.job.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.whoiszxl.zhipin.job.cqrs.query.JobQuery;
import com.whoiszxl.zhipin.job.cqrs.response.JobResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.entity.Job;
import com.whoiszxl.zhipin.job.mapper.JobMapper;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(Job.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, JobMapper.class.getName()),
                Job.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private JobMapper jobMapper;

    @Mock
    private ICompanyService companyService;

    @InjectMocks
    private JobServiceImpl jobService;

    @Test
    void jobDetailReturnsNullWhenJobDoesNotExist() {
        when(jobMapper.selectById(404L)).thenReturn(null);

        JobResponse result = jobService.jobDetail(404L);

        assertThat(result).isNull();
        verifyNoInteractions(companyService);
    }

    @Test
    void latestListKeepsEmptyPageStable() {
        JobQuery query = new JobQuery();
        query.setPage(1);
        query.setSize(10);
        IPage<Job> emptyPage = new Page<Job>(1, 10).setRecords(Collections.emptyList());
        when(jobMapper.selectPage(any(), any())).thenReturn(emptyPage);

        PageResponse<JobResponse> result = jobService.latestList(query);

        assertThat(result.getList()).isEmpty();
        assertThat(result.getTotal()).isZero();
        verifyNoInteractions(companyService);
    }

    @Test
    void latestListFillsCompanyResponseForJobs() {
        JobQuery query = new JobQuery();
        query.setPage(1);
        query.setSize(10);

        Job job = new Job();
        job.setId(1L);
        job.setCompanyId(10L);
        job.setJobName("Java Developer");
        IPage<Job> page = new Page<Job>(1, 10).setRecords(Collections.singletonList(job));
        page.setTotal(1);
        when(jobMapper.selectPage(any(), any())).thenReturn(page);

        Company company = new Company();
        company.setId(10L);
        company.setCompanyAbbrName("TT");
        when(companyService.listByIds(Collections.singletonList(10L))).thenReturn(Collections.singletonList(company));

        PageResponse<JobResponse> result = jobService.latestList(query);

        assertThat(result.getList()).hasSize(1);
        assertThat(result.getList().get(0).getCompanyResponse().getCompanyAbbrName()).isEqualTo("TT");
    }

    @Test
    void recommendListRanksByReplyCountThenFreshness() {
        JobQuery query = new JobQuery();
        query.setPage(1);
        query.setSize(10);
        IPage<Job> emptyPage = new Page<Job>(1, 10).setRecords(Collections.emptyList());
        when(jobMapper.selectPage(any(), any())).thenReturn(emptyPage);

        jobService.recommendList(query);

        Wrapper<Job> wrapper = captureJobWrapper();
        assertThat(wrapper.getSqlSegment())
                .contains("reply_count")
                .contains("updated_at")
                .contains("created_at");
    }

    @Test
    void nearbyListRanksByDistanceWhenLocationProvided() {
        JobQuery query = new JobQuery();
        query.setPage(1);
        query.setSize(10);
        query.setLatitude(new BigDecimal("28.195666"));
        query.setLongitude(new BigDecimal("112.962398"));
        IPage<Job> emptyPage = new Page<Job>(1, 10).setRecords(Collections.emptyList());
        when(jobMapper.selectPage(any(), any())).thenReturn(emptyPage);

        jobService.nearbyList(query);

        Wrapper<Job> wrapper = captureJobWrapper();
        assertThat(wrapper.getSqlSegment())
                .contains("latitude")
                .contains("longitude")
                .contains("ORDER BY ABS(latitude - 28.195666) + ABS(longitude - 112.962398) ASC");
    }

    private Wrapper<Job> captureJobWrapper() {
        @SuppressWarnings("unchecked")
        org.mockito.ArgumentCaptor<Wrapper<Job>> wrapperCaptor = org.mockito.ArgumentCaptor.forClass(Wrapper.class);
        verify(jobMapper).selectPage(any(), wrapperCaptor.capture());
        return wrapperCaptor.getValue();
    }
}
