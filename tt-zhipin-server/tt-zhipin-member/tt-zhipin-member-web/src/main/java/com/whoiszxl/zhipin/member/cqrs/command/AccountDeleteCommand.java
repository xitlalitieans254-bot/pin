package com.whoiszxl.zhipin.member.cqrs.command;

import lombok.Data;

@Data
public class AccountDeleteCommand {

    private String reason;
}
