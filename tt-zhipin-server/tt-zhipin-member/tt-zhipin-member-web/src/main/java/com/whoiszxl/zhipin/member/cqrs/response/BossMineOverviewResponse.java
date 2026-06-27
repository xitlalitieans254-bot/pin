package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

import java.io.Serializable;

@Data
public class BossMineOverviewResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long memberId;

    private String fullName;

    private String avatar;

    private Integer isToutou;

    private Long companyId;

    private String companyFullName;

    private String companyAbbrName;

    private String companyLogo;

    private Boolean companyVerified;

    private Boolean companyProfileCompleted;

    private Integer onlineJobCount;

    private Integer offlineJobCount;

    private Integer candidateCount;

    private Integer unreadMessageCount;

    private Integer todayViewCount;

    private Integer todayChatCount;

    private Boolean licenseSubmitted;

    private Integer licenseAuditStatus;

    private String licenseAuditText;
}
