package com.whoiszxl.zhipin.member.cqrs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Project experience")
public class ProjectExperienceDto {

    @Schema(description = "Frontend temp id")
    private String id;

    @Schema(description = "Project name")
    private String projectName;

    @Schema(description = "Project role, preferred field for frontend")
    private String role;

    @Schema(description = "Project role, legacy field")
    private String projectRole;

    @Schema(description = "Start date, yyyy-MM or yyyy-MM-dd")
    private String projectDateStart;

    @Schema(description = "End date, yyyy-MM or yyyy-MM-dd")
    private String projectDateEnd;

    @Schema(description = "Project content, preferred field for frontend")
    private String projectContent;

    @Schema(description = "Project result, legacy field")
    private String projectResult;

    @Schema(description = "Project link")
    private String projectLink;
}
