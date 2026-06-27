package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Online resume base profile save command")
public class OnlineResumeBaseSaveCommand {

    @Schema(description = "Full name")
    private String fullName;

    @Schema(description = "Gender: 1 male, 2 female, 3 unknown")
    private Integer gender;

    @Schema(description = "Birthday, yyyy-MM-dd or yyyy-MM")
    private String birthday;

    @Schema(description = "Avatar url")
    private String avatar;

    @Schema(description = "City")
    private String city;

    @Schema(description = "Work status")
    private Integer workStatus;

    @Schema(description = "First work date, yyyy-MM-dd or yyyy-MM")
    private String workDate;

    @Schema(description = "Highest qualification")
    private Integer highestQualification;

    @Schema(description = "Highest qualification type: 1 full-time, 2 part-time")
    private Integer highestQualificationType;
}
