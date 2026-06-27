package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

import java.util.List;

@Data
public class ReportSubmitCommand {

    private String targetType;

    private Long targetId;

    private String reason;

    private String description;

    private List<String> evidenceUrls;
}
