package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

@Data
public class CompanyBlockCommand {

    private Long companyId;

    private String companyName;
}
