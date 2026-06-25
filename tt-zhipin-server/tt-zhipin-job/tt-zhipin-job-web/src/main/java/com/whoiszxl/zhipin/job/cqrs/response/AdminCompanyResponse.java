package com.whoiszxl.zhipin.job.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminCompanyResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long applyMemberId;

    private String companyFullName;

    private String companyAbbrName;

    private String companyLogo;

    private String companyDescription;

    private String companyScale;

    private String financingStage;

    private String industry;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime workDateStart;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime workDateEnd;

    private Integer restWay;

    private Integer overtime;

    private String photo;

    private String employeeWelfare;

    private String mainBusiness;

    private BigDecimal longitude;

    private BigDecimal latitude;

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
