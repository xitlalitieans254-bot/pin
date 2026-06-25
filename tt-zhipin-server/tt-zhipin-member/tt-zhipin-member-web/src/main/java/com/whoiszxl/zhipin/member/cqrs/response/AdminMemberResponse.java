package com.whoiszxl.zhipin.member.cqrs.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Schema(description = "后台会员返回信息")
public class AdminMemberResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String phone;

    private String email;

    private String fullName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime workDate;

    private String wxCode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime birthday;

    private String country;

    private String province;

    private String city;

    private String district;

    private Integer gender;

    private String avatar;

    private String ip;

    private Long loginCount;

    private Long loginErrorCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime lastLogin;

    private Integer identityStatus;

    private Integer workStatus;

    private Integer highestQualification;

    private Integer highestQualificationType;

    private Integer isToutou;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime updatedAt;
}
