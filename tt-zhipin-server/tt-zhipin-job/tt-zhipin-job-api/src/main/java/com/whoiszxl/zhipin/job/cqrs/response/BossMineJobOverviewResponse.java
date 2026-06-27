package com.whoiszxl.zhipin.job.cqrs.response;

import lombok.Data;

import java.io.Serializable;

@Data
public class BossMineJobOverviewResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long companyId;

    private String companyFullName;

    private String companyAbbrName;

    private String companyLogo;

    private Boolean companyVerified;

    private Boolean companyProfileCompleted;

    private Integer onlineJobCount;

    private Integer offlineJobCount;

    private Boolean licenseSubmitted;

    private Integer licenseAuditStatus;

    private String licenseAuditText;
}
