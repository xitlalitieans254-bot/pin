package com.whoiszxl.zhipin.member.cqrs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Education experience")
public class EduExperienceDto {

    @Schema(description = "Frontend temp id")
    private String id;

    @Schema(description = "School name")
    private String schoolName;

    @Schema(description = "Education attainment")
    private String educationAttainment;

    @Schema(description = "Major")
    private String major;

    @Schema(description = "Start year")
    private Integer yearStart;

    @Schema(description = "End year")
    private Integer yearEnd;

    @Schema(description = "School experience")
    private String schoolExp;

    @Schema(description = "Paper or graduation design")
    private String paper;
}
