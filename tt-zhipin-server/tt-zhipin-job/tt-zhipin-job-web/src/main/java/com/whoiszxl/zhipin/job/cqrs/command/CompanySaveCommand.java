package com.whoiszxl.zhipin.job.cqrs.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "招聘方企业资料保存命令")
public class CompanySaveCommand {

    @NotBlank(message = "公司全称不能为空")
    @Schema(description = "公司全称")
    private String companyFullName;

    @NotBlank(message = "公司简称不能为空")
    @Schema(description = "公司简称")
    private String companyAbbrName;

    @Schema(description = "公司Logo URL")
    private String companyLogo;

    @Schema(description = "公司描述")
    private String companyDescription;

    @Schema(description = "公司规模")
    private String companyScale;

    @Schema(description = "融资阶段")
    private String financingStage;

    @Schema(description = "所属行业")
    private String industry;

    @Schema(description = "上班时间")
    private LocalDateTime workDateStart;

    @Schema(description = "下班时间")
    private LocalDateTime workDateEnd;

    @Schema(description = "休息方式: 1-双休 2-排班轮休")
    private Integer restWay;

    @Schema(description = "加班情况: 1-不加班 2-偶尔加班 3-弹性工作")
    private Integer overtime;

    @Schema(description = "公司照片 JSON 数组。可传数组或 JSON 数组字符串，空字符串按 [] 处理")
    private Object photo;

    @Schema(description = "员工福利 JSON 数组。可传数组或 JSON 数组字符串，空字符串按 [] 处理")
    private Object employeeWelfare;

    @Schema(description = "主营业务 JSON 数组。可传数组或 JSON 数组字符串，空字符串按 [] 处理")
    private Object mainBusiness;

    @Schema(description = "公司经度")
    private BigDecimal longitude;

    @Schema(description = "公司纬度")
    private BigDecimal latitude;

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
}
