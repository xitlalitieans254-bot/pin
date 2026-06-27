package com.whoiszxl.zhipin.member.cqrs.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitResultResponse {

    private Long id;

    private Integer status;
}
