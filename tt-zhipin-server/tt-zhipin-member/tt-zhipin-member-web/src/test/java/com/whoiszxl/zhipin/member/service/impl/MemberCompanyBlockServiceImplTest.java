package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.whoiszxl.zhipin.member.cqrs.command.CompanyBlockCommand;
import com.whoiszxl.zhipin.member.entity.MemberCompanyBlock;
import com.whoiszxl.zhipin.member.mapper.MemberCompanyBlockMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberCompanyBlockServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(MemberCompanyBlock.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, MemberCompanyBlockMapper.class.getName()),
                MemberCompanyBlock.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private MemberCompanyBlockServiceImpl companyBlockService;

    @Test
    void addCurrentSavesNewBlockedCompany() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(companyBlockService).getOne(anyBlockWrapper());
        doReturn(true).when(companyBlockService).save(any(MemberCompanyBlock.class));

        CompanyBlockCommand command = new CompanyBlockCommand();
        command.setCompanyId(456L);
        command.setCompanyName("  AI Zhipin  ");

        Boolean result = companyBlockService.addCurrent(command);

        assertThat(result).isTrue();
        ArgumentCaptor<MemberCompanyBlock> captor = ArgumentCaptor.forClass(MemberCompanyBlock.class);
        verify(companyBlockService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getCompanyId()).isEqualTo(456L);
        assertThat(captor.getValue().getCompanyName()).isEqualTo("AI Zhipin");
        assertThat(captor.getValue().getStatus()).isEqualTo(1);
    }

    @Test
    void addCurrentReEnablesExistingBlockedCompany() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        MemberCompanyBlock existing = new MemberCompanyBlock();
        existing.setMemberId(123L);
        existing.setCompanyId(456L);
        existing.setStatus(0);
        doReturn(existing).when(companyBlockService).getOne(anyBlockWrapper());
        doReturn(true).when(companyBlockService).update(anyBlockWrapper());

        CompanyBlockCommand command = new CompanyBlockCommand();
        command.setCompanyId(456L);
        command.setCompanyName("AI Zhipin");

        Boolean result = companyBlockService.addCurrent(command);

        assertThat(result).isTrue();
        verify(companyBlockService).update(anyBlockWrapper());
    }

    @Test
    void deleteCurrentIsIdempotent() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(false).when(companyBlockService).update(anyBlockWrapper());

        CompanyBlockCommand command = new CompanyBlockCommand();
        command.setCompanyId(456L);

        Boolean result = companyBlockService.deleteCurrent(command);

        assertThat(result).isTrue();
        verify(companyBlockService).update(anyBlockWrapper());
    }

    @SuppressWarnings("unchecked")
    private Wrapper<MemberCompanyBlock> anyBlockWrapper() {
        return any(Wrapper.class);
    }
}
