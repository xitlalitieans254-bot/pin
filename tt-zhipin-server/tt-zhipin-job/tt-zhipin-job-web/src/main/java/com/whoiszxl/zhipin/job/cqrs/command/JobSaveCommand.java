package com.whoiszxl.zhipin.job.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Data
@Schema(description = "招聘方职位保存命令")
public class JobSaveCommand {

    @Schema(description = "职位ID，传入时为编辑，不传为新增")
    private Long id;

    @Schema(description = "企业ID，不传则使用当前招聘方的企业资料")
    private Long companyId;

    @NotBlank(message = "职位名称不能为空")
    @Schema(description = "职位名称")
    private String jobName;

    @Schema(description = "薪资范围起始值，单位K")
    private Integer salaryRangeStart;

    @Schema(description = "薪资范围结束值，单位K")
    private Integer salaryRangeEnd;

    @Schema(description = "薪资可选项 JSON 字符串")
    private String salaryOptional;

    @Schema(description = "工作年限范围起始值")
    private Integer workYearRangeStart;

    @Schema(description = "工作年限范围结束值")
    private Integer workYearRangeEnd;

    @Schema(description = "年龄范围起始值")
    private Integer ageRangeStart;

    @Schema(description = "年龄范围结束值")
    private Integer ageRangeEnd;

    @Schema(description = "学历")
    private String educationAttainment;

    @Schema(description = "职位标签 JSON 数组字符串")
    private String jobTags;

    @NotBlank(message = "职位描述不能为空")
    @Schema(description = "职位描述")
    private String jobDescription;

    @Schema(description = "工作地址经度")
    private BigDecimal longitude;

    @Schema(description = "工作地址纬度")
    private BigDecimal latitude;

    @Schema(description = "工作地址地图静态图")
    private String locationImg;

    @Schema(description = "国家")
    private String country;

    @Schema(description = "省份")
    private String province;

    @Schema(description = "城市")
    private String city;

    @Schema(description = "区域")
    private String district;

    @Schema(description = "详细地址")
    private String addressDetail;

    @Schema(description = "状态: 0-下架 1-上架，新增默认上架")
    private Integer status;
}
