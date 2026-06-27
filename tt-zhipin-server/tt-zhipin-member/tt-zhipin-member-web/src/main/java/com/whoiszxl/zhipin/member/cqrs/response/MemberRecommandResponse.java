package com.whoiszxl.zhipin.member.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "Recommended member response")
public class MemberRecommandResponse implements Serializable {

    @Schema(description = "Member id")
    private Long id;

    @Schema(description = "Phone")
    private String phone;

    @Schema(description = "Email")
    private String email;

    @Schema(description = "Full name")
    private String fullName;

    @Schema(description = "First work date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime workDate;

    @Schema(description = "Wechat code")
    private String wxCode;

    @Schema(description = "Birthday")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime birthday;

    @Schema(description = "Country")
    private String country;

    @Schema(description = "Province")
    private String province;

    @Schema(description = "City")
    private String city;

    @Schema(description = "District")
    private String district;

    @Schema(description = "Gender")
    private Integer gender;

    @Schema(description = "Avatar")
    private String avatar;

    @Schema(description = "IP")
    private String ip;

    @Schema(description = "Login count")
    private Long loginCount;

    @Schema(description = "Login error count")
    private Long loginErrorCount;

    @Schema(description = "Last login")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime lastLogin;

    @Schema(description = "Identity status")
    private Integer identityStatus;

    @Schema(description = "Work status")
    private Integer workStatus;

    @Schema(description = "Highest qualification")
    private Integer highestQualification;

    @Schema(description = "Highest qualification type")
    private Integer highestQualificationType;

    @Schema(description = "Whether member is boss")
    private Integer isToutou;

    @Schema(description = "Whether resume is visible to boss")
    private Boolean visible = true;

    @Schema(description = "Resume advantage")
    private String advantage;

    @Schema(description = "Resume summary")
    private String summary;

    @Schema(description = "First expected job")
    private String expectJob;

    @Schema(description = "Expected jobs")
    private List<String> expectJobs;

    @Schema(description = "Expected city")
    private String expectCity;

    @Schema(description = "Expected salary start, unit K")
    private Integer salaryRangeStart;

    @Schema(description = "Expected salary end, unit K")
    private Integer salaryRangeEnd;
}
