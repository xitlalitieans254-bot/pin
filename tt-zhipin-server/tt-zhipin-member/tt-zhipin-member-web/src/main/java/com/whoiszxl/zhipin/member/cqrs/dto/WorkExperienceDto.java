package com.whoiszxl.zhipin.member.cqrs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Work experience")
public class WorkExperienceDto {

    @Schema(description = "Frontend temp id")
    private String id;

    @Schema(description = "Company name")
    private String companyFullName;

    @Schema(description = "Industry")
    private String industry;

    @Schema(description = "Start date, yyyy-MM or yyyy-MM-dd")
    private String workDateStart;

    @Schema(description = "End date, yyyy-MM or yyyy-MM-dd")
    private String workDateEnd;

    @Schema(description = "Job title, preferred field for frontend")
    private String job;

    @Schema(description = "Job title, legacy field")
    private String jobName;

    @Schema(description = "Work content, preferred field for frontend")
    private String workContent;

    @Schema(description = "Work content, legacy field")
    private String workDetail;
}
