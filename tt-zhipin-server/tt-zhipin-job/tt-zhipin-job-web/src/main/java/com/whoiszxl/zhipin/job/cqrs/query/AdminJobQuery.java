package com.whoiszxl.zhipin.job.cqrs.query;

import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "后台职位分页查询")
public class AdminJobQuery extends PageQuery {

    @Schema(description = "职位名称、描述、城市、地址关键词")
    private String keyword;

    @Schema(description = "状态: 0-下架 1-上架")
    private Integer status;

    @Schema(description = "企业ID")
    private Long companyId;

    @Schema(description = "城市")
    private String city;
}
