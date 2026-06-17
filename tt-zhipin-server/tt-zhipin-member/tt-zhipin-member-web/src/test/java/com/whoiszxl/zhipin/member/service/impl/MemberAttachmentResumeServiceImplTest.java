package com.whoiszxl.zhipin.member.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.LambdaUtils;
import com.whoiszxl.zhipin.member.cqrs.command.AttachmentResumeSaveCommand;
import com.whoiszxl.zhipin.member.entity.MemberAttachmentResume;
import com.whoiszxl.zhipin.member.mapper.MemberAttachmentResumeMapper;
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

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberAttachmentResumeServiceImplTest {

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        Configuration configuration = new Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        TableInfoHelper.remove(MemberAttachmentResume.class);
        TableInfo tableInfo = TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(configuration, MemberAttachmentResumeMapper.class.getName()),
                MemberAttachmentResume.class);
        LambdaUtils.installCache(tableInfo);
    }

    @Mock
    private TokenHelper tokenHelper;

    @Spy
    @InjectMocks
    private MemberAttachmentResumeServiceImpl attachmentResumeService;

    @Test
    void saveResumeTrimsFilenameAndUrlBeforeSaving() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(null).when(attachmentResumeService).getOne(anyResumeWrapper());
        doReturn(0L).when(attachmentResumeService).count(anyResumeWrapper());
        doReturn(true).when(attachmentResumeService).save(any(MemberAttachmentResume.class));

        AttachmentResumeSaveCommand command = new AttachmentResumeSaveCommand();
        command.setFilename("  resume.pdf  ");
        command.setUrl("  https://example.com/resume.pdf  ");

        Boolean saved = attachmentResumeService.saveResume(command);

        assertThat(saved).isTrue();
        ArgumentCaptor<MemberAttachmentResume> resumeCaptor = ArgumentCaptor.forClass(MemberAttachmentResume.class);
        verify(attachmentResumeService).save(resumeCaptor.capture());

        MemberAttachmentResume savedResume = resumeCaptor.getValue();
        assertThat(savedResume.getMemberId()).isEqualTo(123L);
        assertThat(savedResume.getFilename()).isEqualTo("resume.pdf");
        assertThat(savedResume.getUrl()).isEqualTo("https://example.com/resume.pdf");
    }

    @Test
    void saveResumeUpdatesExistingUrlInsteadOfCreatingDuplicate() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        MemberAttachmentResume existingResume = new MemberAttachmentResume();
        existingResume.setId(99L);
        existingResume.setMemberId(123L);
        existingResume.setUrl("https://example.com/resume.pdf");

        doReturn(existingResume).when(attachmentResumeService).getOne(anyResumeWrapper());
        doReturn(true).when(attachmentResumeService).update(anyResumeWrapper());

        AttachmentResumeSaveCommand command = new AttachmentResumeSaveCommand();
        command.setFilename("resume-new.pdf");
        command.setUrl("https://example.com/resume.pdf");

        Boolean saved = attachmentResumeService.saveResume(command);

        assertThat(saved).isTrue();
        verify(attachmentResumeService).update(anyResumeWrapper());
        verify(attachmentResumeService, never()).count(anyResumeWrapper());
        verify(attachmentResumeService, never()).save(any(MemberAttachmentResume.class));
    }

    @Test
    void listCurrentMemberResumesScopesToCurrentMemberAndOrdersNewestFirst() {
        when(tokenHelper.getAppMemberId()).thenReturn(123L);
        doReturn(Collections.emptyList()).when(attachmentResumeService).list(anyResumeWrapper());

        attachmentResumeService.listCurrentMemberResumes();

        ArgumentCaptor<Wrapper<MemberAttachmentResume>> wrapperCaptor = wrapperCaptor();
        verify(attachmentResumeService).list(wrapperCaptor.capture());

        String sqlSegment = wrapperCaptor.getValue().getSqlSegment();
        assertThat(sqlSegment).contains("member_id");
        assertThat(sqlSegment).contains("ORDER BY");
        assertThat(sqlSegment).contains("created_at");
        assertThat(sqlSegment).contains("id");
    }

    @SuppressWarnings("unchecked")
    private Wrapper<MemberAttachmentResume> anyResumeWrapper() {
        return any(Wrapper.class);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private ArgumentCaptor<Wrapper<MemberAttachmentResume>> wrapperCaptor() {
        return ArgumentCaptor.forClass((Class) Wrapper.class);
    }
}
