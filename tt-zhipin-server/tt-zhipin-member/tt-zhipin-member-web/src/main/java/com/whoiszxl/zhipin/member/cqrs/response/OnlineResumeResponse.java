package com.whoiszxl.zhipin.member.cqrs.response;

import com.whoiszxl.zhipin.member.cqrs.dto.EduExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.ProjectExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExperienceDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
@Schema(description = "Online resume response")
public class OnlineResumeResponse {

    @Schema(description = "Member id")
    private Long memberId;

    @Schema(description = "Whether resume is visible to boss")
    private Boolean visible = true;

    @Schema(description = "Member info")
    private MemberInfoResponse memberInfoResponse;

    @Schema(description = "Avatar url")
    private String avatar = "";

    @Schema(description = "Full name")
    private String fullName = "";

    @Schema(description = "Gender")
    private Integer gender;

    @Schema(description = "Birthday, yyyy-MM-dd")
    private String birthday = "";

    @Schema(description = "City")
    private String city = "";

    @Schema(description = "Work status")
    private Integer workStatus;

    @Schema(description = "First work date, yyyy-MM-dd")
    private String workDate = "";

    @Schema(description = "Highest qualification")
    private Integer highestQualification;

    @Schema(description = "Highest qualification type")
    private Integer highestQualificationType;

    @Schema(description = "Work expectation list")
    private List<WorkExpectDto> workExpectDtoList = Collections.emptyList();

    @Schema(description = "Work experience list")
    private List<WorkExperienceDto> workExperienceDtoList = Collections.emptyList();

    @Schema(description = "Project experience list")
    private List<ProjectExperienceDto> projectExperienceDtoList = Collections.emptyList();

    @Schema(description = "Education experience list")
    private List<EduExperienceDto> eduExperienceDtoList = Collections.emptyList();

    @Schema(description = "Qualification list")
    private List<String> qualificationList = Collections.emptyList();

    @Schema(description = "Skill tag list")
    private List<String> skillTagList = Collections.emptyList();

    @Schema(description = "Personal advantage")
    private String advantage = "";
}
