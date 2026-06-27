package com.whoiszxl.zhipin.member.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CompanyBlockResponse {

    private Long id;

    private Long companyId;

    private String companyName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdAt;
}
