package com.whoiszxl.zhipin.job.cqrs.query;

import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "后台企业分页查询")
public class AdminCompanyQuery extends PageQuery {

    @Schema(description = "公司名称关键词")
    private String keyword;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "行业")
    private String industry;

    @Schema(description = "城市")
    private String city;
}
