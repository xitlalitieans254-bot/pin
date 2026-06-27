package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.whoiszxl.zhipin.member.cqrs.command.AccountDeleteCommand;
import com.whoiszxl.zhipin.member.cqrs.response.SubmitResultResponse;
import com.whoiszxl.zhipin.member.entity.MemberAccountDeleteApply;
import com.whoiszxl.zhipin.member.mapper.MemberAccountDeleteApplyMapper;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberAccountDeleteApplyServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(MemberAccountDeleteApply.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, MemberAccountDeleteApplyMapper.class.getName()),
                MemberAccountDeleteApply.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private MemberAccountDeleteApplyServiceImpl accountDeleteApplyService;

    @Test
    void applyDeleteReusesPendingApplication() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        MemberAccountDeleteApply existing = new MemberAccountDeleteApply();
        existing.setId(9L);
        existing.setMemberId(123L);
        existing.setStatus(1);
        doReturn(existing).when(accountDeleteApplyService).getOne(anyApplyWrapper());

        SubmitResultResponse response = accountDeleteApplyService.applyDelete(new AccountDeleteCommand());

        assertThat(response.getId()).isEqualTo(9L);
        assertThat(response.getStatus()).isEqualTo(1);
        verify(accountDeleteApplyService, never()).save(any(MemberAccountDeleteApply.class));
    }

    @Test
    void applyDeleteCreatesApplicationWhenNoPendingApplicationExists() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(accountDeleteApplyService).getOne(anyApplyWrapper());
        doReturn(true).when(accountDeleteApplyService).save(any(MemberAccountDeleteApply.class));

        AccountDeleteCommand command = new AccountDeleteCommand();
        command.setReason("  no longer use it  ");
        SubmitResultResponse response = accountDeleteApplyService.applyDelete(command);

        assertThat(response.getStatus()).isEqualTo(1);
        ArgumentCaptor<MemberAccountDeleteApply> captor = ArgumentCaptor.forClass(MemberAccountDeleteApply.class);
        verify(accountDeleteApplyService).save(captor.capture());
        assertThat(captor.getValue().getMemberId()).isEqualTo(123L);
        assertThat(captor.getValue().getReason()).isEqualTo("no longer use it");
    }

    @SuppressWarnings("unchecked")
    private Wrapper<MemberAccountDeleteApply> anyApplyWrapper() {
        return any(Wrapper.class);
    }
}
