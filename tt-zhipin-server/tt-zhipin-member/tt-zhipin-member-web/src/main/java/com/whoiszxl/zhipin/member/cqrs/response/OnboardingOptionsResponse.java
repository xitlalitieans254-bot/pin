package com.whoiszxl.zhipin.member.cqrs.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "Onboarding option response")
public class OnboardingOptionsResponse {

    private List<OptionItemResponse> roles = new ArrayList<>();

    private List<OptionItemResponse> jobseekerSteps = new ArrayList<>();

    private List<OptionItemResponse> bossSteps = new ArrayList<>();

    private List<OptionItemResponse> cities = new ArrayList<>();

    private List<OptionItemResponse> jobCategories = new ArrayList<>();

    private List<OptionItemResponse> industries = new ArrayList<>();

    private List<OptionItemResponse> skillTags = new ArrayList<>();

    private List<OptionItemResponse> educationAttainments = new ArrayList<>();

    private List<OptionItemResponse> educationTypes = new ArrayList<>();

    private List<OptionItemResponse> workStatuses = new ArrayList<>();

    private List<OptionItemResponse> companyScales = new ArrayList<>();

    private List<OptionItemResponse> restWays = new ArrayList<>();

    private List<OptionItemResponse> overtimeOptions = new ArrayList<>();

    private List<OptionItemResponse> experienceRequirements = new ArrayList<>();

    private List<OptionItemResponse> salaryRanges = new ArrayList<>();

    private List<OptionItemResponse> virtualAvatars = new ArrayList<>();
}
