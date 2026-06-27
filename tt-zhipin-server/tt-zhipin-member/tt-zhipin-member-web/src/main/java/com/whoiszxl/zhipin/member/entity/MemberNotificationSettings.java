package com.whoiszxl.zhipin.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ums_member_notification_settings")
public class MemberNotificationSettings implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "member_id", type = IdType.INPUT)
    private Long memberId;

    private Boolean messageNotify;

    private Boolean jobRecommendNotify;

    private Boolean resumeViewNotify;

    private Boolean candidateNotify;

    private Integer status;

    @Version
    private Long version;

    @TableLogic
    private Integer isDeleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
