package com.whoiszxl.zhipin.member.cqrs.command;

import com.whoiszxl.zhipin.member.cqrs.dto.EduExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.ProjectExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExperienceDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Online resume save command")
public class OnlineResumeSaveCommand extends OnlineResumeBaseSaveCommand {

    @Schema(description = "Personal advantage")
    private String advantage;

    @Schema(description = "Work expectation list")
    private List<WorkExpectDto> workExpectDtoList;

    @Schema(description = "Work experience list")
    private List<WorkExperienceDto> workExperienceDtoList;

    @Schema(description = "Project experience list")
    private List<ProjectExperienceDto> projectExperienceDtoList;

    @Schema(description = "Education experience list")
    private List<EduExperienceDto> eduExperienceDtoList;

    @Schema(description = "Qualification list")
    private List<String> qualificationList;

    @Schema(description = "Skill tag list")
    private List<String> skillTagList;
}
