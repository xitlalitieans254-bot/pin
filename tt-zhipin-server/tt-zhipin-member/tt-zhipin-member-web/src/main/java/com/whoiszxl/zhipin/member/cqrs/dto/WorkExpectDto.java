package com.whoiszxl.zhipin.member.cqrs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Work expectation")
public class WorkExpectDto {

    @Schema(description = "Frontend temp id")
    private String id;

    @Schema(description = "Work type: 1 full-time, 2 part-time")
    private Integer type;

    @Schema(description = "Expected city")
    private String city;

    @Schema(description = "Expected job")
    private String job;

    @Schema(description = "Expected salary start, unit K")
    private Integer salaryRangeStart;

    @Schema(description = "Expected salary end, unit K")
    private Integer salaryRangeEnd;

    @Schema(description = "Expected industries")
    private String[] industryArr;
}
