package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.Data;

@Data
public class HelpResponse {

    private Long id;

    private String category;

    private String title;

    private String content;
}
