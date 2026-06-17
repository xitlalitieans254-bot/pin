package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.whoiszxl.zhipin.member.cqrs.command.ToutouSubmitCommand;
import com.whoiszxl.zhipin.member.entity.MemberToutou;
import com.whoiszxl.zhipin.member.mapper.MemberToutouMapper;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberToutouServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(MemberToutou.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, MemberToutouMapper.class.getName()),
                MemberToutou.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private MemberToutouMapper memberToutouMapper;

    @Mock
    private TokenHelper tokenHelper;

    @InjectMocks
    private MemberToutouServiceImpl memberToutouService;

    @Test
    void toutouSubmitCreatesLicenseRecordForCurrentAppMember() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        when(memberToutouMapper.selectOne(anyWrapper())).thenReturn(null);

        ToutouSubmitCommand command = new ToutouSubmitCommand();
        command.setBusinessLicense("  https://example.com/license.png  ");

        memberToutouService.toutouSubmit(command);

        ArgumentCaptor<MemberToutou> captor = ArgumentCaptor.forClass(MemberToutou.class);
        verify(memberToutouMapper).insert(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getBusinessLicense()).isEqualTo("https://example.com/license.png");
    }

    @Test
    void toutouSubmitUpdatesExistingLicenseRecord() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        MemberToutou existing = new MemberToutou();
        existing.setMemberId(123L);
        existing.setBusinessLicense("old");
        when(memberToutouMapper.selectOne(anyWrapper())).thenReturn(existing);

        ToutouSubmitCommand command = new ToutouSubmitCommand();
        command.setBusinessLicense("https://example.com/new-license.png");

        memberToutouService.toutouSubmit(command);

        ArgumentCaptor<MemberToutou> captor = ArgumentCaptor.forClass(MemberToutou.class);
        verify(memberToutouMapper).update(captor.capture(), anyWrapper());
        assertThat(captor.getValue().getBusinessLicense()).isEqualTo("https://example.com/new-license.png");
    }

    @SuppressWarnings("unchecked")
    private Wrapper<MemberToutou> anyWrapper() {
        return any(Wrapper.class);
    }
}
