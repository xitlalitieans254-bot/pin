package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@Schema(description = "附件简历名称更新命令")
public class ResumeNameUpdateCommand {

    @NotBlank(message = "附件简历id不能为空")
    @Schema(description = "附件简历id")
    private String id;

    @NotBlank(message = "附件简历名称不能为空")
    @Size(max = 256, message = "附件简历名称不能超过256个字符")
    @Schema(description = "附件简历新名称")
    private String newFilename;
}
