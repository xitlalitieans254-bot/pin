package com.whoiszxl.zhipin.member.cqrs.query;

import com.whoiszxl.zhipin.tools.common.entity.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "后台会员分页查询")
public class AdminMemberQuery extends PageQuery {

    @Schema(description = "手机号、姓名、邮箱关键词")
    private String keyword;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "身份状态: 1-职场人 2-学生")
    private Integer identityStatus;

    @Schema(description = "是否招聘者: 0-否 1-是")
    private Integer isToutou;
}
