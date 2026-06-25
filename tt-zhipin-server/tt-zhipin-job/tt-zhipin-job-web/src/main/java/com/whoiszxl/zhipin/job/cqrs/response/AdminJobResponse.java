package com.whoiszxl.zhipin.job.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminJobResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long memberId;

    private String memberInfo;

    private Long companyId;

    private String companyFullName;

    private String companyAbbrName;

    private String jobName;

    private Integer salaryRangeStart;

    private Integer salaryRangeEnd;

    private String salaryOptional;

    private Integer workYearRangeStart;

    private Integer workYearRangeEnd;

    private Integer ageRangeStart;

    private Integer ageRangeEnd;

    private String educationAttainment;

    private String jobTags;

    private String jobDescription;

    private Integer replyCount;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private String locationImg;

    private String country;

    private String province;

    private String city;

    private String district;

    private String addressDetail;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedAt;
}
