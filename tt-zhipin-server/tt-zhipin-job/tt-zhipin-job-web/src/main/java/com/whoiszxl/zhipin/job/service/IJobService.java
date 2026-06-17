package com.whoiszxl.zhipin.job.service;

import com.whoiszxl.zhipin.job.cqrs.command.JobSaveCommand;
import com.whoiszxl.zhipin.job.cqrs.command.JobStatusCommand;
import com.whoiszxl.zhipin.job.cqrs.query.JobQuery;
import com.whoiszxl.zhipin.job.cqrs.response.JobResponse;
import com.whoiszxl.zhipin.job.entity.Job;
import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;

/**
 * <p>
 * 职位表 服务类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-09
 */
public interface IJobService extends IService<Job> {

    /**
     * 获取推荐职位列表
     * @param query 查询参数
     * @return 推荐职位列表
     */
    PageResponse<JobResponse> recommendList(JobQuery query);

    /**
     * 获取附近职位列表
     * @param query 查询参数
     * @return 附近职位列表
     */
    PageResponse<JobResponse> nearbyList(JobQuery query);

    /**
     * 获取最新的职位列表
     * @param query 查询参数
     * @return 最新的职位列表
     */
    PageResponse<JobResponse> latestList(JobQuery query);

    /**
     * 通过职位ID获取职位详情
     * @param jobId 职位ID
     * @return职位详情
     */
    JobResponse jobDetail(Long jobId);

    /**
     * 招聘方保存职位
     * @param command 职位信息
     * @return 保存后的职位
     */
    JobResponse saveBossJob(JobSaveCommand command);

    /**
     * 招聘方查看自己的职位列表
     * @param query 分页查询
     * @return 职位列表
     */
    PageResponse<JobResponse> bossJobList(PageQuery query);

    /**
     * 招聘方上下架职位
     * @param command 状态命令
     * @return 是否成功
     */
    Boolean changeBossJobStatus(JobStatusCommand command);

    /**
     * 招聘方删除自己的职位
     * @param jobId 职位ID
     * @return 是否成功
     */
    Boolean deleteBossJob(Long jobId);
}
