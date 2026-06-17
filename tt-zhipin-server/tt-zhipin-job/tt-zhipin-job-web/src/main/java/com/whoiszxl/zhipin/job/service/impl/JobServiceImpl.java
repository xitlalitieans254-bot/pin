package com.whoiszxl.zhipin.job.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.job.cqrs.command.JobSaveCommand;
import com.whoiszxl.zhipin.job.cqrs.command.JobStatusCommand;
import com.whoiszxl.zhipin.job.cqrs.query.JobQuery;
import com.whoiszxl.zhipin.job.cqrs.response.CompanyResponse;
import com.whoiszxl.zhipin.job.cqrs.response.JobResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.entity.Job;
import com.whoiszxl.zhipin.job.mapper.JobMapper;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.job.service.IJobService;
import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import com.whoiszxl.zhipin.tools.common.utils.LoggerUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * <p>
 * 职位表 服务实现类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-09
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobServiceImpl extends ServiceImpl<JobMapper, Job> implements IJobService {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int ONLINE_STATUS = 1;
    private static final int OFFLINE_STATUS = 0;
    private static final long INIT_VERSION = 1L;
    private static final int NOT_DELETED = 0;
    private static final String DEFAULT_RECRUITER_TITLE = "招聘者";

    private final JobMapper jobMapper;

    private final ICompanyService companyService;

    private final TokenHelper tokenHelper;

    @Override
    public PageResponse<JobResponse> recommendList(JobQuery query) {
        LoggerUtil.info(log, "JobServiceImpl", "获取首页推荐职位列表", query);
        return pageJobList(query, wrapper -> wrapper
                .orderByDesc(Job::getReplyCount)
                .orderByDesc(Job::getUpdatedAt)
                .orderByDesc(Job::getCreatedAt));
    }

    @Override
    public PageResponse<JobResponse> nearbyList(JobQuery query) {
        LoggerUtil.info(log, "JobServiceImpl", "获取首页附近职位列表", query);
        return pageJobList(query, wrapper -> {
            if (hasValidLocation(query)) {
                wrapper.isNotNull(Job::getLatitude)
                        .isNotNull(Job::getLongitude)
                        .last(buildDistanceOrderSql(query));
                return;
            }

            wrapper.orderByDesc(Job::getCreatedAt);
        });
    }

    @Override
    public PageResponse<JobResponse> latestList(JobQuery query) {
        LoggerUtil.info(log, "JobServiceImpl", "获取首页最新职位列表", query);
        return pageJobList(query, wrapper -> wrapper.orderByDesc(Job::getCreatedAt));
    }

    private PageResponse<JobResponse> pageJobList(JobQuery query, Consumer<LambdaQueryWrapper<Job>> wrapperCustomizer) {
        LambdaQueryWrapper<Job> wrapper = Wrappers.<Job>lambdaQuery();
        if(StrUtil.isNotBlank(query.getEducationAttainment())) {
            wrapper.eq(Job::getEducationAttainment, query.getEducationAttainment());
        }
        if(CollUtil.isNotEmpty(query.getSalary()) && query.getSalary().size() == 2) {
            wrapper.ge(Job::getSalaryRangeStart, query.getSalary().get(0)).and((w) -> {
                w.lt(Job::getSalaryRangeEnd, query.getSalary().get(1));
            });
        }
        wrapperCustomizer.accept(wrapper);
        query.setSort(null);
        IPage<Job> jobPage = jobMapper.selectPage(query.toPage(), wrapper);
        PageResponse<JobResponse> pageResponse = PageResponse.convert(jobPage, JobResponse.class);

        fillCompanyInfo(pageResponse);
        return pageResponse;
    }

    private void fillCompanyInfo(PageResponse<JobResponse> pageResponse) {
        if (pageResponse == null || CollUtil.isEmpty(pageResponse.getList())) {
            return;
        }

        List<Long> companyIdList = pageResponse.getList().stream()
                .map(JobResponse::getCompanyId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (CollUtil.isEmpty(companyIdList)) {
            return;
        }

        List<Company> companyList = companyService.listByIds(companyIdList);
        List<CompanyResponse> companyResponseList = BeanUtil.copyToList(companyList, CompanyResponse.class);

        Map<Long, CompanyResponse> companyMap = companyResponseList.stream()
                .collect(Collectors.toMap(CompanyResponse::getId, company -> company, (left, right) -> left));

        pageResponse.getList().forEach(job -> {
            CompanyResponse company = companyMap.get(job.getCompanyId());
            if (company != null) {
                job.setCompanyResponse(company);
            }
        });
    }

    private boolean hasValidLocation(JobQuery query) {
        return isBetween(query.getLatitude(), "-90", "90")
                && isBetween(query.getLongitude(), "-180", "180");
    }

    private boolean isBetween(BigDecimal value, String min, String max) {
        if (value == null) {
            return false;
        }
        return value.compareTo(new BigDecimal(min)) >= 0
                && value.compareTo(new BigDecimal(max)) <= 0;
    }

    private String buildDistanceOrderSql(JobQuery query) {
        return "ORDER BY ABS(latitude - " + query.getLatitude().stripTrailingZeros().toPlainString()
                + ") + ABS(longitude - " + query.getLongitude().stripTrailingZeros().toPlainString()
                + ") ASC, created_at DESC";
    }

    @Override
    public JobResponse jobDetail(Long jobId) {
        Job job = jobMapper.selectById(jobId);
        if (job == null) {
            return null;
        }

        Company company = companyService.getById(job.getCompanyId());
        JobResponse jobResponse = BeanUtil.copyProperties(job, JobResponse.class);
        if (company != null) {
            jobResponse.setCompanyResponse(BeanUtil.copyProperties(company, CompanyResponse.class));
        }
        return jobResponse;
    }

    @Override
    public JobResponse saveBossJob(JobSaveCommand command) {
        AppLoginMember currentMember = tokenHelper.getAppLoginMember();
        Long memberId = requireBossMember(currentMember);
        Assert.isTrue(command.getStatus() == null
                || ONLINE_STATUS == command.getStatus()
                || OFFLINE_STATUS == command.getStatus(), "职位状态错误");
        Assert.isTrue(StrUtil.isNotBlank(command.getJobName()), "职位名称不能为空");
        Assert.isTrue(StrUtil.isNotBlank(command.getJobDescription()), "职位描述不能为空");

        Company company = resolveCurrentMemberCompany(command.getCompanyId(), memberId);
        Job job = resolveBossJob(command.getId(), memberId);
        boolean createFlag = job == null;
        if(createFlag) {
            job = new Job();
            job.setId(IdUtil.getSnowflakeNextId());
            job.setMemberId(memberId);
            job.setReplyCount(0);
            job.setVersion(INIT_VERSION);
            job.setIsDeleted(NOT_DELETED);
        }

        applyCommand(job, command, company, currentMember);
        boolean saved = createFlag ? this.save(job) : this.updateById(job);
        Assert.isTrue(saved, "职位保存失败");
        JobResponse response = toResponse(job);
        response.setCompanyResponse(BeanUtil.copyProperties(company, CompanyResponse.class));
        return response;
    }

    @Override
    public PageResponse<JobResponse> bossJobList(PageQuery query) {
        if(query == null) {
            query = new PageQuery();
        }
        normalizePageQuery(query);
        Long memberId = tokenHelper.getAppMemberId();
        Assert.notNull(memberId, "当前登录用户不能为空");
        LambdaQueryWrapper<Job> wrapper = Wrappers.<Job>lambdaQuery()
                .eq(Job::getMemberId, memberId)
                .orderByDesc(Job::getUpdatedAt)
                .orderByDesc(Job::getCreatedAt)
                .orderByDesc(Job::getId);
        IPage<Job> jobPage = jobMapper.selectPage(query.toPage(), wrapper);
        PageResponse<JobResponse> pageResponse = PageResponse.convert(jobPage, JobResponse.class);
        fillCompanyInfo(pageResponse);
        return pageResponse;
    }

    @Override
    public Boolean changeBossJobStatus(JobStatusCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        Assert.notNull(memberId, "当前登录用户不能为空");
        Assert.isTrue(ONLINE_STATUS == command.getStatus() || OFFLINE_STATUS == command.getStatus(), "职位状态错误");

        Job job = new Job();
        job.setStatus(command.getStatus());
        return this.update(job, Wrappers.<Job>lambdaQuery()
                .eq(Job::getId, command.getJobId())
                .eq(Job::getMemberId, memberId));
    }

    @Override
    public Boolean deleteBossJob(Long jobId) {
        Long memberId = tokenHelper.getAppMemberId();
        Assert.notNull(memberId, "当前登录用户不能为空");
        Assert.notNull(jobId, "职位ID不能为空");
        return this.remove(Wrappers.<Job>lambdaQuery()
                .eq(Job::getId, jobId)
                .eq(Job::getMemberId, memberId));
    }

    private Long requireBossMember(AppLoginMember currentMember) {
        Assert.notNull(currentMember, "当前登录用户不能为空");
        Assert.notNull(currentMember.getId(), "当前登录用户不能为空");
        Assert.isTrue(Integer.valueOf(ONLINE_STATUS).equals(currentMember.getIsToutou()), "请先切换为招聘方身份");
        return currentMember.getId();
    }

    private Company resolveCurrentMemberCompany(Long companyId, Long memberId) {
        Company company = companyId == null
                ? companyService.getOne(Wrappers.<Company>lambdaQuery()
                    .eq(Company::getApplyMemberId, memberId)
                    .last("LIMIT 1"))
                : companyService.getById(companyId);
        Assert.isTrue(company != null && memberId.equals(company.getApplyMemberId()), "企业信息不存在或不属于当前用户");
        return company;
    }

    private Job resolveBossJob(Long jobId, Long memberId) {
        if(jobId == null) {
            return null;
        }
        Job job = this.getById(jobId);
        Assert.isTrue(job != null && memberId.equals(job.getMemberId()), "职位不存在或不属于当前用户");
        return job;
    }

    private void applyCommand(Job job, JobSaveCommand command, Company company, AppLoginMember member) {
        job.setCompanyId(company.getId());
        job.setMemberInfo(buildMemberInfo(member, company));
        job.setJobName(StrUtil.trim(command.getJobName()));
        job.setSalaryRangeStart(defaultInteger(command.getSalaryRangeStart(), 1));
        job.setSalaryRangeEnd(defaultInteger(command.getSalaryRangeEnd(), 1));
        job.setSalaryOptional(StrUtil.trim(command.getSalaryOptional()));
        job.setWorkYearRangeStart(defaultInteger(command.getWorkYearRangeStart(), 1));
        job.setWorkYearRangeEnd(defaultInteger(command.getWorkYearRangeEnd(), 1));
        job.setAgeRangeStart(defaultInteger(command.getAgeRangeStart(), 18));
        job.setAgeRangeEnd(defaultInteger(command.getAgeRangeEnd(), 18));
        job.setEducationAttainment(StrUtil.trim(command.getEducationAttainment()));
        job.setJobTags(StrUtil.trim(command.getJobTags()));
        job.setJobDescription(StrUtil.trim(command.getJobDescription()));
        job.setLongitude(command.getLongitude());
        job.setLatitude(command.getLatitude());
        job.setLocationImg(StrUtil.trim(command.getLocationImg()));
        job.setCountry(StrUtil.trim(command.getCountry()));
        job.setProvince(StrUtil.trim(command.getProvince()));
        job.setCity(StrUtil.trim(command.getCity()));
        job.setDistrict(StrUtil.trim(command.getDistrict()));
        job.setAddressDetail(StrUtil.trim(command.getAddressDetail()));
        job.setStatus(command.getStatus() == null ? ONLINE_STATUS : command.getStatus());
    }

    private String buildMemberInfo(AppLoginMember member, Company company) {
        JSONObject memberInfo = JSONUtil.createObj()
                .set("id", member.getId())
                .set("name", StrUtil.blankToDefault(member.getFullName(), member.getPhone()))
                .set("avatar", StrUtil.nullToEmpty(member.getAvatar()))
                .set("jobTitle", DEFAULT_RECRUITER_TITLE)
                .set("companyAbbrName", StrUtil.nullToEmpty(company.getCompanyAbbrName()));
        return memberInfo.toString();
    }

    private JobResponse toResponse(Job job) {
        return BeanUtil.copyProperties(job, JobResponse.class);
    }

    private Integer defaultInteger(Integer value, Integer defaultValue) {
        return value == null ? defaultValue : value;
    }

    private void normalizePageQuery(PageQuery query) {
        if(query.getPage() == null) {
            query.setPage(FIRST_PAGE);
        }
        if(query.getSize() == null) {
            query.setSize(DEFAULT_PAGE_SIZE);
        }
    }
}
