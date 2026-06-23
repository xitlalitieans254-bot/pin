package com.whoiszxl.zhipin.job.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.job.cqrs.command.CompanySaveCommand;
import com.whoiszxl.zhipin.job.cqrs.response.CompanyResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.mapper.CompanyMapper;
import com.whoiszxl.zhipin.job.service.ICompanyService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 公司表 服务实现类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-09
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceImpl extends ServiceImpl<CompanyMapper, Company> implements ICompanyService {

    private static final int ENABLED_STATUS = 1;
    private static final long INIT_VERSION = 1L;
    private static final int NOT_DELETED = 0;
    private static final String EMPTY_JSON_ARRAY = "[]";

    private final TokenHelper tokenHelper;

    @Override
    public CompanyResponse myCompany() {
        Company company = getCurrentMemberCompany();
        return company == null ? null : toResponse(company);
    }

    @Override
    public CompanyResponse saveMyCompany(CompanySaveCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        Assert.notNull(memberId, "当前登录用户不能为空");
        Assert.isTrue(StrUtil.isNotBlank(command.getCompanyFullName()), "公司全称不能为空");
        Assert.isTrue(StrUtil.isNotBlank(command.getCompanyAbbrName()), "公司简称不能为空");

        Company company = getCurrentMemberCompany();
        boolean createFlag = company == null;
        if(createFlag) {
            company = new Company();
            company.setId(IdUtil.getSnowflakeNextId());
            company.setApplyMemberId(memberId);
            company.setStatus(ENABLED_STATUS);
            company.setVersion(INIT_VERSION);
            company.setIsDeleted(NOT_DELETED);
        }

        applyCommand(company, command);
        boolean saved = createFlag ? this.save(company) : this.updateById(company);
        Assert.isTrue(saved, "企业资料保存失败");
        return toResponse(company);
    }

    private Company getCurrentMemberCompany() {
        Long memberId = tokenHelper.getAppMemberId();
        Assert.notNull(memberId, "当前登录用户不能为空");
        return this.getOne(Wrappers.<Company>lambdaQuery()
                .eq(Company::getApplyMemberId, memberId)
                .last("LIMIT 1"));
    }

    private void applyCommand(Company company, CompanySaveCommand command) {
        company.setCompanyFullName(StrUtil.trim(command.getCompanyFullName()));
        company.setCompanyAbbrName(StrUtil.trim(command.getCompanyAbbrName()));
        company.setCompanyLogo(StrUtil.trim(command.getCompanyLogo()));
        company.setCompanyDescription(StrUtil.trim(command.getCompanyDescription()));
        company.setCompanyScale(StrUtil.trim(command.getCompanyScale()));
        company.setFinancingStage(StrUtil.trim(command.getFinancingStage()));
        company.setIndustry(StrUtil.trim(command.getIndustry()));
        company.setWorkDateStart(command.getWorkDateStart());
        company.setWorkDateEnd(command.getWorkDateEnd());
        validateEnumValue(command.getRestWay(), 1, 2, "休息方式不正确");
        validateEnumValue(command.getOvertime(), 1, 3, "加班情况不正确");
        company.setRestWay(command.getRestWay());
        company.setOvertime(command.getOvertime());
        company.setPhoto(normalizeJsonArrayField(command.getPhoto(), "公司照片格式不正确"));
        company.setEmployeeWelfare(normalizeJsonArrayField(command.getEmployeeWelfare(), "员工福利格式不正确"));
        company.setMainBusiness(normalizeJsonArrayField(command.getMainBusiness(), "主营业务格式不正确"));
        company.setLongitude(command.getLongitude());
        company.setLatitude(command.getLatitude());
        company.setCountry(StrUtil.trim(command.getCountry()));
        company.setProvince(StrUtil.trim(command.getProvince()));
        company.setCity(StrUtil.trim(command.getCity()));
        company.setDistrict(StrUtil.trim(command.getDistrict()));
        company.setAddressDetail(StrUtil.trim(command.getAddressDetail()));
    }

    private CompanyResponse toResponse(Company company) {
        return BeanUtil.copyProperties(company, CompanyResponse.class);
    }

    private void validateEnumValue(Integer value, int min, int max, String message) {
        if(value == null) {
            return;
        }
        Assert.isTrue(value >= min && value <= max, message);
    }

    private String normalizeJsonArrayField(Object value, String errorMessage) {
        if(value == null) {
            return null;
        }

        if(value instanceof CharSequence) {
            String text = StrUtil.trim(String.valueOf(value));
            if(StrUtil.isBlank(text)) {
                return EMPTY_JSON_ARRAY;
            }
            if(!text.startsWith("[") || !text.endsWith("]")) {
                throw new IllegalArgumentException(errorMessage);
            }
            return parseJsonArray(text, errorMessage);
        }

        if(!(value instanceof Iterable) && !value.getClass().isArray()) {
            throw new IllegalArgumentException(errorMessage);
        }
        return parseJsonArray(JSONUtil.toJsonStr(value), errorMessage);
    }

    private String parseJsonArray(String text, String errorMessage) {
        try {
            return JSONUtil.parseArray(text).toString();
        } catch (Exception e) {
            throw new IllegalArgumentException(errorMessage);
        }
    }
}
