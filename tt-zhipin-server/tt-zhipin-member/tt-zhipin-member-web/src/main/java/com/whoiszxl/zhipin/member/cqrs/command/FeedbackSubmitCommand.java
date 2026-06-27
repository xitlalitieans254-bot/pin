package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

import java.util.List;

@Data
public class FeedbackSubmitCommand {

    private String feedbackType;

    private String content;

    private String contact;

    private List<String> evidenceUrls;
}
