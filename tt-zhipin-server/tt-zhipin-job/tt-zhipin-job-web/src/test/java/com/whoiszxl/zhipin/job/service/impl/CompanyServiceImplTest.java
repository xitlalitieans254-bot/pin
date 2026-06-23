package com.whoiszxl.zhipin.job.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.whoiszxl.zhipin.job.cqrs.command.CompanySaveCommand;
import com.whoiszxl.zhipin.job.cqrs.response.CompanyResponse;
import com.whoiszxl.zhipin.job.entity.Company;
import com.whoiszxl.zhipin.job.mapper.CompanyMapper;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
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
import java.util.Arrays;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(Company.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, CompanyMapper.class.getName()),
                Company.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private CompanyServiceImpl companyService;

    @Test
    void saveMyCompanyCreatesCompanyForCurrentMember() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());
        doReturn(true).when(companyService).save(any(Company.class));

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("  AI智聘科技有限公司  ");
        command.setCompanyAbbrName("  AI智聘  ");
        command.setCompanyLogo("https://example.com/logo.png");
        command.setCity("长沙");
        command.setLatitude(new BigDecimal("28.195666"));
        command.setLongitude(new BigDecimal("112.962398"));

        CompanyResponse response = companyService.saveMyCompany(command);

        assertThat(response.getApplyMemberId()).isEqualTo(123L);
        assertThat(response.getCompanyFullName()).isEqualTo("AI智聘科技有限公司");
        assertThat(response.getCompanyAbbrName()).isEqualTo("AI智聘");

        ArgumentCaptor<Company> companyCaptor = ArgumentCaptor.forClass(Company.class);
        verify(companyService).save(companyCaptor.capture());
        Company savedCompany = companyCaptor.getValue();
        assertThat(savedCompany.getId()).isNotNull();
        assertThat(savedCompany.getApplyMemberId()).isEqualTo(123L);
        assertThat(savedCompany.getStatus()).isEqualTo(1);
        assertThat(savedCompany.getVersion()).isEqualTo(1L);
        assertThat(savedCompany.getIsDeleted()).isZero();
        verify(companyService, never()).updateById(any(Company.class));
    }

    @Test
    void saveMyCompanyUpdatesExistingCompanyForCurrentMember() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        Company existingCompany = new Company();
        existingCompany.setId(99L);
        existingCompany.setApplyMemberId(123L);
        existingCompany.setCompanyFullName("Old Name");
        existingCompany.setCompanyAbbrName("Old");
        doReturn(existingCompany).when(companyService).getOne(anyCompanyWrapper());
        doReturn(true).when(companyService).updateById(any(Company.class));

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("New Full Name");
        command.setCompanyAbbrName("New");
        command.setIndustry("互联网");

        CompanyResponse response = companyService.saveMyCompany(command);

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getApplyMemberId()).isEqualTo(123L);
        assertThat(response.getCompanyFullName()).isEqualTo("New Full Name");
        assertThat(response.getCompanyAbbrName()).isEqualTo("New");
        assertThat(response.getIndustry()).isEqualTo("互联网");

        verify(companyService).updateById(existingCompany);
        verify(companyService, never()).save(any(Company.class));
    }

    @Test
    void myCompanyScopesLookupToCurrentMember() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());

        CompanyResponse response = companyService.myCompany();

        assertThat(response).isNull();
        ArgumentCaptor<Wrapper<Company>> wrapperCaptor = wrapperCaptor();
        verify(companyService).getOne(wrapperCaptor.capture());
        assertThat(wrapperCaptor.getValue().getSqlSegment()).contains("apply_member_id");
    }

    @Test
    void saveMyCompanyNormalizesJsonArrayFieldsBeforePersisting() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());
        doReturn(true).when(companyService).save(any(Company.class));

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("AI智聘科技有限公司");
        command.setCompanyAbbrName("AI智聘");
        command.setPhoto("");
        command.setEmployeeWelfare(Arrays.asList(
                Collections.singletonMap("title", "五险一金"),
                Collections.singletonMap("title", "年终奖")
        ));
        command.setMainBusiness("[\"AI招聘\",\"人才服务\"]");
        command.setRestWay(2);
        command.setOvertime(3);

        companyService.saveMyCompany(command);

        ArgumentCaptor<Company> companyCaptor = ArgumentCaptor.forClass(Company.class);
        verify(companyService).save(companyCaptor.capture());
        Company savedCompany = companyCaptor.getValue();
        assertThat(savedCompany.getPhoto()).isEqualTo("[]");
        assertThat(savedCompany.getEmployeeWelfare()).contains("五险一金", "年终奖");
        assertThat(savedCompany.getMainBusiness()).isEqualTo("[\"AI招聘\",\"人才服务\"]");
        assertThat(savedCompany.getRestWay()).isEqualTo(2);
        assertThat(savedCompany.getOvertime()).isEqualTo(3);
    }

    @Test
    void saveMyCompanyRejectsInvalidJsonArrayFieldWithBusinessMessage() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("AI智聘科技有限公司");
        command.setCompanyAbbrName("AI智聘");
        command.setPhoto("not json");

        assertThatThrownBy(() -> companyService.saveMyCompany(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("公司照片格式不正确");
    }

    @Test
    void saveMyCompanyRejectsJsonObjectForArrayField() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("AI智聘科技有限公司");
        command.setCompanyAbbrName("AI智聘");
        command.setPhoto(Collections.singletonMap("url", "https://example.com/company.png"));

        assertThatThrownBy(() -> companyService.saveMyCompany(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("公司照片格式不正确");
    }

    @Test
    void saveMyCompanyRejectsInvalidRestWayBeforePersisting() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyService).getOne(anyCompanyWrapper());

        CompanySaveCommand command = new CompanySaveCommand();
        command.setCompanyFullName("AI智聘科技有限公司");
        command.setCompanyAbbrName("AI智聘");
        command.setRestWay(3);

        assertThatThrownBy(() -> companyService.saveMyCompany(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("休息方式不正确");
        verify(companyService, never()).save(any(Company.class));
    }

    @SuppressWarnings("unchecked")
    private Wrapper<Company> anyCompanyWrapper() {
        return any(Wrapper.class);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ArgumentCaptor<Wrapper<Company>> wrapperCaptor() {
        return ArgumentCaptor.forClass((Class) Wrapper.class);
    }
}
