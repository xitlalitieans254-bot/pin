package com.whoiszxl.zhipin.job.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.whoiszxl.zhipin.job.cqrs.command.JobSaveCommand;
import com.whoiszxl.zhipin.job.cqrs.command.JobStatusCommand;
import com.whoiszxl.zhipin.job.cqrs.response.JobResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.entity.Job;
import com.whoiszxl.zhipin.job.mapper.JobMapper;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BossJobServiceImplTest {

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

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private JobServiceImpl jobService;

    @Test
    void saveBossJobCreatesJobForCurrentMemberCompany() {
        AppLoginMember member = currentBossMember();
        when(tokenHelper.getAppLoginMember()).thenReturn(member);
        Company company = currentMemberCompany();
        when(companyService.getById(10L)).thenReturn(company);
        doReturn(true).when(jobService).save(any(Job.class));

        JobSaveCommand command = new JobSaveCommand();
        command.setCompanyId(10L);
        command.setJobName("  Java开发工程师  ");
        command.setSalaryRangeStart(12);
        command.setSalaryRangeEnd(18);
        command.setEducationAttainment("本科");
        command.setJobTags("[\"Java\",\"Spring\"]");
        command.setJobDescription("负责后端开发");
        command.setCity("长沙");
        command.setLatitude(new BigDecimal("28.195666"));
        command.setLongitude(new BigDecimal("112.962398"));

        JobResponse response = jobService.saveBossJob(command);

        assertThat(response.getMemberId()).isEqualTo(123L);
        assertThat(response.getCompanyId()).isEqualTo(10L);
        assertThat(response.getJobName()).isEqualTo("Java开发工程师");
        assertThat(response.getStatus()).isEqualTo(1);
        assertThat(response.getCompanyResponse().getCompanyAbbrName()).isEqualTo("AI智聘");
        assertThat(response.getMemberInfo()).contains("Boss Wang").contains("AI智聘");

        ArgumentCaptor<Job> jobCaptor = ArgumentCaptor.forClass(Job.class);
        verify(jobService).save(jobCaptor.capture());
        Job savedJob = jobCaptor.getValue();
        assertThat(savedJob.getId()).isNotNull();
        assertThat(savedJob.getMemberId()).isEqualTo(123L);
        assertThat(savedJob.getStatus()).isEqualTo(1);
        assertThat(savedJob.getReplyCount()).isZero();
        assertThat(savedJob.getVersion()).isEqualTo(1L);
        assertThat(savedJob.getIsDeleted()).isZero();
        verify(jobService, never()).updateById(any(Job.class));
    }

    @Test
    void saveBossJobRejectsCompanyOwnedByAnotherMember() {
        when(tokenHelper.getAppLoginMember()).thenReturn(currentBossMember());
        Company company = currentMemberCompany();
        company.setApplyMemberId(456L);
        when(companyService.getById(10L)).thenReturn(company);

        JobSaveCommand command = new JobSaveCommand();
        command.setCompanyId(10L);
        command.setJobName("Java开发工程师");
        command.setJobDescription("负责后端开发");

        assertThatThrownBy(() -> jobService.saveBossJob(command))
                .hasMessageContaining("企业信息不存在");
        verify(jobService, never()).save(any(Job.class));
        verify(jobService, never()).updateById(any(Job.class));
    }

    @Test
    void bossJobListScopesToCurrentMemberAndFillsCompanyInfo() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        Job job = new Job();
        job.setId(1L);
        job.setMemberId(123L);
        job.setCompanyId(10L);
        job.setJobName("Java开发工程师");
        IPage<Job> page = new Page<Job>(1, 10).setRecords(Collections.singletonList(job));
        page.setTotal(1);
        when(jobMapper.selectPage(any(), any())).thenReturn(page);
        when(companyService.listByIds(Collections.singletonList(10L)))
                .thenReturn(Collections.singletonList(currentMemberCompany()));

        PageQuery query = new PageQuery();
        query.setPage(1);
        query.setSize(10);
        PageResponse<JobResponse> response = jobService.bossJobList(query);

        assertThat(response.getList()).hasSize(1);
        assertThat(response.getList().get(0).getCompanyResponse().getCompanyAbbrName()).isEqualTo("AI智聘");
        Wrapper<Job> wrapper = captureJobWrapper();
        assertThat(wrapper.getSqlSegment()).contains("member_id").contains("ORDER BY");
    }

    @Test
    void changeBossJobStatusOnlyUpdatesCurrentMembersJob() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(true).when(jobService).update(any(Job.class), any(Wrapper.class));

        JobStatusCommand command = new JobStatusCommand();
        command.setJobId(1L);
        command.setStatus(0);

        Boolean changed = jobService.changeBossJobStatus(command);

        assertThat(changed).isTrue();
        ArgumentCaptor<Wrapper<Job>> wrapperCaptor = wrapperCaptor();
        verify(jobService).update(any(Job.class), wrapperCaptor.capture());
        assertThat(wrapperCaptor.getValue().getSqlSegment()).contains("id").contains("member_id");
    }

    private AppLoginMember currentBossMember() {
        AppLoginMember member = new AppLoginMember();
        member.setId(123L);
        member.setFullName("Boss Wang");
        member.setPhone("13800138000");
        member.setAvatar("https://example.com/avatar.png");
        member.setIsToutou(1);
        return member;
    }

    private Company currentMemberCompany() {
        Company company = new Company();
        company.setId(10L);
        company.setApplyMemberId(123L);
        company.setCompanyFullName("AI智聘科技有限公司");
        company.setCompanyAbbrName("AI智聘");
        return company;
    }

    private Wrapper<Job> captureJobWrapper() {
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Wrapper<Job>> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(jobMapper).selectPage(any(), wrapperCaptor.capture());
        return wrapperCaptor.getValue();
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ArgumentCaptor<Wrapper<Job>> wrapperCaptor() {
        return ArgumentCaptor.forClass((Class) Wrapper.class);
    }
}
