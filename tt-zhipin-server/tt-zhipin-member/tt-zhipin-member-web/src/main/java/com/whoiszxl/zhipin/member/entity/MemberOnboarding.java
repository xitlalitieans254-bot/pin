package com.whoiszxl.zhipin.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ums_member_onboarding")
@Schema(description = "Member onboarding progress and draft")
public class MemberOnboarding implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "member_id", type = IdType.INPUT)
    @Schema(description = "Member ID")
    private Long memberId;

    @Schema(description = "Current selected role: JOBSEEKER or BOSS")
    private String role;

    @Schema(description = "Current onboarding step key")
    private String currentStep;

    @Schema(description = "Current onboarding step index")
    private Integer currentStepIndex;

    @Schema(description = "Jobseeker onboarding draft JSON")
    private String jobseekerDraft;

    @Schema(description = "Boss onboarding draft JSON")
    private String bossDraft;

    @Schema(description = "Whether jobseeker onboarding is completed")
    private Integer jobseekerCompleted;

    @Schema(description = "Whether boss onboarding is completed")
    private Integer bossCompleted;

    @Schema(description = "Status: 0 disabled, 1 enabled")
    private Integer status;

    @Version
    @Schema(description = "Optimistic lock version")
    private Long version;

    @TableLogic
    @Schema(description = "Logic delete flag")
    private Integer isDeleted;

    @Schema(description = "Created time")
    private LocalDateTime createdAt;

    @Schema(description = "Updated time")
    private LocalDateTime updatedAt;
}
