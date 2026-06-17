package com.whoiszxl.zhipin.member.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@Schema(description = "附件简历保存命令")
public class AttachmentResumeSaveCommand {

    @NotBlank(message = "文件名不能为空")
    @Size(max = 256, message = "文件名不能超过256个字符")
    @Schema(description = "文件名称")
    private String filename;

    @NotBlank(message = "文件地址不能为空")
    @Size(max = 256, message = "文件地址不能超过256个字符")
    @Schema(description = "文件路径")
    private String url;
}
