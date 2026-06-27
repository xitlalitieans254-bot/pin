package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class WorkerMineOverviewResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long memberId;

    private String fullName;

    private String avatar;

    private String city;

    private Integer workStatus;

    private Boolean onlineResumeCompleted;

    private Integer onlineResumeScore;

    private Boolean onlineResumeVisible;

    private Integer attachmentResumeCount;

    private Integer communicatedCount;

    private Integer deliveredCount;

    private Integer interviewCount;

    private Integer favoriteJobCount;

    private Integer resumeViewCount;

    private Boolean resumeRefreshAvailable;

    private LocalDateTime lastResumeRefreshTime;
}
