package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ResumeRefreshResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Boolean resumeRefreshAvailable;

    private LocalDateTime lastResumeRefreshTime;

    private LocalDateTime nextRefreshTime;
}
