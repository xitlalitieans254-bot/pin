package com.whoiszxl.zhipin.job.service;

import com.whoiszxl.zhipin.job.cqrs.command.CompanySaveCommand;
import com.whoiszxl.zhipin.job.cqrs.response.CompanyResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * <p>
 * 公司表 服务类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-09
 */
public interface ICompanyService extends IService<Company> {

    /**
     * 获取当前招聘方企业资料
     * @return 企业资料
     */
    CompanyResponse myCompany();

    /**
     * 保存当前招聘方企业资料
     * @param command 企业资料
     * @return 保存后的企业资料
     */
    CompanyResponse saveMyCompany(CompanySaveCommand command);
}
