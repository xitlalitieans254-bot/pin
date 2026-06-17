package com.whoiszxl.zhipin.job.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
@Schema(description = "招聘方职位状态修改命令")
public class JobStatusCommand {

    @NotNull(message = "职位ID不能为空")
    @Schema(description = "职位ID")
    private Long jobId;

    @NotNull(message = "职位状态不能为空")
    @Schema(description = "状态: 0-下架 1-上架")
    private Integer status;
}
