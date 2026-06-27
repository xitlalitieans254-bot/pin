package com.whoiszxl.zhipin.member.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingCompleteCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingDraftSaveCommand;
import com.whoiszxl.zhipin.member.cqrs.command.OnboardingRoleCommand;
import com.whoiszxl.zhipin.member.cqrs.dto.EduExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExpectDto;
import com.whoiszxl.zhipin.member.cqrs.dto.WorkExperienceDto;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingDraftResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingOptionsResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OnboardingStatusResponse;
import com.whoiszxl.zhipin.member.cqrs.response.OptionItemResponse;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.entity.MemberExp;
import com.whoiszxl.zhipin.member.entity.MemberOnboarding;
import com.whoiszxl.zhipin.member.mapper.MemberOnboardingMapper;
import com.whoiszxl.zhipin.member.service.IMemberExpService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.member.service.IOnboardingService;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl extends ServiceImpl<MemberOnboardingMapper, MemberOnboarding> implements IOnboardingService {

    public static final String ROLE_JOBSEEKER = "JOBSEEKER";
    public static final String ROLE_BOSS = "BOSS";

    private static final String PAGE_ROLE_SELECT = "ROLE_SELECT";
    private static final String PAGE_JOBSEEKER_ONBOARDING = "JOBSEEKER_ONBOARDING";
    private static final String PAGE_BOSS_ONBOARDING = "BOSS_ONBOARDING";
    private static final String PAGE_JOBSEEKER_HOME = "JOBSEEKER_HOME";
    private static final String PAGE_BOSS_HOME = "BOSS_HOME";
    private static final String STEP_ROLE_SELECTED = "ROLE_SELECTED";
    private static final String STEP_COMPLETED = "COMPLETED";

    private static final int YES = 1;
    private static final int NO = 0;
    private static final int ENABLED = 1;
    private static final long INIT_VERSION = 1L;
    private static final int NOT_DELETED = 0;

    private final TokenHelper tokenHelper;
    private final IMemberService memberService;
    private final IMemberExpService memberExpService;

    @Override
    public OnboardingStatusResponse status() {
        Long memberId = tokenHelper.getAppMemberId();
        MemberOnboarding record = getCurrentRecord(memberId);
        return toStatusResponse(memberId, record, record == null ? null : record.getRole());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OnboardingStatusResponse chooseRole(OnboardingRoleCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        String role = normalizeRole(command.getRole());
        if(ROLE_BOSS.equals(role)) {
            memberService.becomeBoss();
        }

        MemberOnboarding record = getCurrentRecord(memberId);
        boolean createFlag = record == null;
        if(createFlag) {
            record = newRecord(memberId);
        }

        record.setRole(role);
        record.setCurrentStep(STEP_ROLE_SELECTED);
        record.setCurrentStepIndex(0);
        boolean saved = createFlag ? this.save(record) : this.update(record, wrapperByMemberId(memberId));
        Assert.isTrue(saved, "onboarding role save failed");
        return toStatusResponse(memberId, record, role);
    }

    @Override
    public OnboardingDraftResponse draft(String role) {
        Long memberId = tokenHelper.getAppMemberId();
        String normalizedRole = normalizeRole(role);
        MemberOnboarding record = getCurrentRecord(memberId);
        return toDraftResponse(memberId, normalizedRole, record);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OnboardingDraftResponse saveDraft(OnboardingDraftSaveCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        String role = normalizeRole(command.getRole());
        Assert.isTrue(StrUtil.isNotBlank(command.getStepKey()), "stepKey is required");

        MemberOnboarding record = getCurrentRecord(memberId);
        boolean createFlag = record == null;
        if(createFlag) {
            record = newRecord(memberId);
        }

        Map<String, Object> draft = draftMap(record, role);
        Map<String, Object> stepData = command.getStepData() == null
                ? new LinkedHashMap<String, Object>()
                : new LinkedHashMap<>(command.getStepData());
        draft.put(StrUtil.trim(command.getStepKey()), stepData);
        setDraft(record, role, draft);

        record.setRole(role);
        record.setCurrentStep(StrUtil.trim(command.getStepKey()));
        record.setCurrentStepIndex(command.getStepIndex() == null ? 0 : command.getStepIndex());

        boolean saved = createFlag ? this.save(record) : this.update(record, wrapperByMemberId(memberId));
        Assert.isTrue(saved, "onboarding draft save failed");
        return toDraftResponse(memberId, role, record);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OnboardingStatusResponse complete(OnboardingCompleteCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        String role = normalizeRole(command.getRole());
        MemberOnboarding record = getCurrentRecord(memberId);
        Assert.notNull(record, "onboarding draft does not exist");

        if(ROLE_JOBSEEKER.equals(role)) {
            validateJobseekerDraft(record);
            materializeJobseekerDraft(memberId, record);
            record.setJobseekerCompleted(YES);
        } else {
            memberService.becomeBoss();
            record.setBossCompleted(YES);
        }

        record.setRole(role);
        record.setCurrentStep(STEP_COMPLETED);
        boolean saved = this.update(record, wrapperByMemberId(memberId));
        Assert.isTrue(saved, "onboarding complete failed");
        return toStatusResponse(memberId, record, role);
    }

    @Override
    public OnboardingOptionsResponse options() {
        OnboardingOptionsResponse response = new OnboardingOptionsResponse();
        response.setRoles(Arrays.asList(item(ROLE_JOBSEEKER, "我要找工作"), item(ROLE_BOSS, "我要招人")));
        response.setJobseekerSteps(Arrays.asList(
                item("job_preference", "完善资料、快速找工作"),
                item("salary", "期望月薪"),
                item("basic_info", "创建在线简历"),
                item("work_status", "求职状态"),
                item("first_work_time", "首次工作时间"),
                item("recent_work", "最近一份工作"),
                item("recent_company", "最近就职公司"),
                item("work_period", "公司工作时间段"),
                item("skills", "技能标签"),
                item("work_detail", "工作内容"),
                item("education", "最高学历"),
                item("school", "毕业学校"),
                item("major", "专业"),
                item("education_period", "就读时间段"),
                item("advantage", "个人优势"),
                item("avatar", "头像")
        ));
        response.setBossSteps(Arrays.asList(
                item("company_name", "公司名称"),
                item("company_industry", "公司行业"),
                item("company_scale", "公司规模"),
                item("job_name", "职位名称"),
                item("job_description", "职位描述"),
                item("job_requirements", "经验学历薪资"),
                item("job_address", "工作地址"),
                item("publish_confirm", "发布确认")
        ));
        response.setCities(options("泉州", "厦门", "福州", "深圳", "广州", "上海", "北京", "杭州", "成都"));
        response.setIndustries(options("互联网/AI", "电子/通信", "产品", "设计", "服务业", "教育培训", "制造业", "金融", "医疗健康"));
        response.setSkillTags(options("需求分析", "用户增长", "交互设计", "项目管理", "Java", "Spring Boot", "React", "销售沟通", "数据分析"));
        response.setEducationAttainments(Arrays.asList(
                item("1", "初中及以下"), item("2", "中专/中技"), item("3", "高中"),
                item("4", "大专"), item("5", "本科"), item("6", "硕士"), item("7", "博士")
        ));
        response.setEducationTypes(Arrays.asList(item("1", "全日制"), item("2", "非全日制")));
        response.setWorkStatuses(Arrays.asList(
                item("1", "离校-随时到岗"), item("2", "在校-月内到岗"),
                item("3", "在校-考虑机会"), item("4", "在校-暂不考虑"),
                item("5", "离职-随时到岗"), item("6", "在职-月内到岗"),
                item("7", "在职-考虑机会"), item("8", "在职-暂不考虑")
        ));
        response.setCompanyScales(options("0-20人", "20-99人", "100-499人", "500-999人", "1000-9999人", "10000人以上"));
        response.setRestWays(Arrays.asList(item("1", "双休"), item("2", "排班轮休")));
        response.setOvertimeOptions(Arrays.asList(item("1", "不加班"), item("2", "偶尔加班"), item("3", "弹性工作")));
        response.setExperienceRequirements(options("不限", "1-3年", "3-5年", "5-10年", "10年以上"));
        response.setSalaryRanges(options("3-5K", "5-8K", "8-12K", "12-20K", "20-30K", "30K以上"));
        response.setVirtualAvatars(options(
                "https://static.ai-zhipin/avatar/avatar-1.png",
                "https://static.ai-zhipin/avatar/avatar-2.png",
                "https://static.ai-zhipin/avatar/avatar-3.png",
                "https://static.ai-zhipin/avatar/avatar-4.png"
        ));
        response.setJobCategories(jobCategoryOptions());
        return response;
    }

    private void validateJobseekerDraft(MemberOnboarding record) {
        JSONObject draft = JSONUtil.parseObj(StrUtil.blankToDefault(record.getJobseekerDraft(), "{}"));

        JSONObject preference = step(draft, "job_preference");
        List<String> jobs = stringList(preference.get("jobs"));
        if(CollUtil.isEmpty(jobs) && StrUtil.isNotBlank(preference.getStr("job"))) {
            jobs.add(preference.getStr("job"));
        }
        Assert.isTrue(jobs.size() <= 3, "up to 3 expected jobs");

        JSONObject skills = step(draft, "skills");
        Assert.isTrue(stringList(skills.get("skills")).size() <= 5, "up to 5 skills");

        JSONObject salary = step(draft, "salary");
        Integer salaryRangeStart = salary.getInt("salaryRangeStart");
        Integer salaryRangeEnd = salary.getInt("salaryRangeEnd");
        if(salaryRangeStart != null && salaryRangeEnd != null) {
            Assert.isTrue(salaryRangeEnd >= salaryRangeStart, "salary end must be greater than salary start");
        }

        JSONObject basicInfo = step(draft, "basic_info");
        LocalDateTime birthday = monthDate(basicInfo, "birthYear", "birthMonth");
        if(birthday != null) {
            Assert.isTrue(!birthday.plusYears(18).isAfter(LocalDateTime.now()), "member must be at least 18 years old");
        }
    }

    private void materializeJobseekerDraft(Long memberId, MemberOnboarding record) {
        JSONObject draft = JSONUtil.parseObj(StrUtil.blankToDefault(record.getJobseekerDraft(), "{}"));
        Member updateMember = new Member();
        updateMember.setId(memberId);

        JSONObject preference = step(draft, "job_preference");
        JSONObject basicInfo = step(draft, "basic_info");
        JSONObject workStatus = step(draft, "work_status");
        JSONObject firstWorkTime = step(draft, "first_work_time");
        JSONObject education = step(draft, "education");
        JSONObject avatar = step(draft, "avatar");

        String fullName = basicInfo.getStr("fullName");
        if(StrUtil.isNotBlank(fullName)) {
            updateMember.setFullName(StrUtil.trim(fullName));
        }
        Integer gender = basicInfo.getInt("gender");
        if(gender != null) {
            updateMember.setGender(gender);
        }
        LocalDateTime birthday = monthDate(basicInfo, "birthYear", "birthMonth");
        if(birthday != null) {
            updateMember.setBirthday(birthday);
        }
        Boolean isStudent = preference.getBool("isStudent");
        if(isStudent != null) {
            updateMember.setIdentityStatus(Boolean.TRUE.equals(isStudent) ? 2 : 1);
        }
        Integer status = workStatus.getInt("workStatus");
        if(status != null) {
            updateMember.setWorkStatus(status);
        }
        LocalDateTime workDate = monthDate(firstWorkTime, "year", "month");
        if(workDate != null) {
            updateMember.setWorkDate(workDate);
        }
        Integer highestQualification = education.getInt("highestQualification");
        if(highestQualification != null) {
            updateMember.setHighestQualification(highestQualification);
        }
        Integer highestQualificationType = education.getInt("highestQualificationType");
        if(highestQualificationType != null) {
            updateMember.setHighestQualificationType(highestQualificationType);
        }
        String avatarUrl = avatar.getStr("avatar");
        if(StrUtil.isNotBlank(avatarUrl)) {
            updateMember.setAvatar(StrUtil.trim(avatarUrl));
        }
        Assert.isTrue(memberService.updateById(updateMember), "member onboarding save failed");
        refreshLoginMember(updateMember);

        MemberExp memberExp = buildMemberExp(memberId, draft);
        MemberExp existing = memberExpService.getOne(Wrappers.<MemberExp>lambdaQuery().eq(MemberExp::getMemberId, memberId));
        boolean saved = existing == null
                ? memberExpService.save(memberExp)
                : memberExpService.update(memberExp, Wrappers.<MemberExp>lambdaUpdate().eq(MemberExp::getMemberId, memberId));
        Assert.isTrue(saved, "resume onboarding save failed");
    }

    private MemberExp buildMemberExp(Long memberId, JSONObject draft) {
        JSONObject preference = step(draft, "job_preference");
        JSONObject salary = step(draft, "salary");
        JSONObject recentWork = step(draft, "recent_work");
        JSONObject recentCompany = step(draft, "recent_company");
        JSONObject workPeriod = step(draft, "work_period");
        JSONObject skills = step(draft, "skills");
        JSONObject workDetail = step(draft, "work_detail");
        JSONObject education = step(draft, "education");
        JSONObject school = step(draft, "school");
        JSONObject major = step(draft, "major");
        JSONObject educationPeriod = step(draft, "education_period");
        JSONObject advantage = step(draft, "advantage");

        MemberExp memberExp = new MemberExp();
        memberExp.setMemberId(memberId);
        memberExp.setStatus(ENABLED);
        memberExp.setVersion(INIT_VERSION);
        memberExp.setIsDeleted(NOT_DELETED);

        List<String> jobs = stringList(preference.get("jobs"));
        if(CollUtil.isEmpty(jobs) && StrUtil.isNotBlank(preference.getStr("job"))) {
            jobs.add(preference.getStr("job"));
        }
        List<WorkExpectDto> workExpectList = new ArrayList<>();
        int limit = Math.min(jobs.size(), 3);
        for(int i = 0; i < limit; i++) {
            WorkExpectDto dto = new WorkExpectDto();
            dto.setType(1);
            dto.setCity(preference.getStr("city"));
            dto.setJob(jobs.get(i));
            dto.setSalaryRangeStart(salary.getInt("salaryRangeStart"));
            dto.setSalaryRangeEnd(salary.getInt("salaryRangeEnd"));
            List<String> industries = stringList(preference.get("industries"));
            if(CollUtil.isNotEmpty(industries)) {
                dto.setIndustryArr(industries.toArray(new String[0]));
            }
            workExpectList.add(dto);
        }
        if(CollUtil.isNotEmpty(workExpectList)) {
            memberExp.setWorkExpect(JSONUtil.toJsonStr(workExpectList));
        }

        WorkExperienceDto workExperience = new WorkExperienceDto();
        workExperience.setCompanyFullName(recentCompany.getStr("companyFullName"));
        workExperience.setIndustry(recentWork.getStr("industry"));
        workExperience.setJobName(recentWork.getStr("jobName"));
        workExperience.setWorkDateStart(monthText(workPeriod, "startYear", "startMonth"));
        workExperience.setWorkDateEnd(monthText(workPeriod, "endYear", "endMonth"));
        workExperience.setWorkDetail(workDetail.getStr("workDetail"));
        if(hasWorkExperience(workExperience)) {
            memberExp.setWorkExperience(JSONUtil.toJsonStr(Collections.singletonList(workExperience)));
        }

        EduExperienceDto eduExperience = new EduExperienceDto();
        eduExperience.setSchoolName(school.getStr("schoolName"));
        eduExperience.setEducationAttainment(education.getStr("educationAttainment", education.getStr("highestQualification")));
        eduExperience.setMajor(major.getStr("major"));
        eduExperience.setYearStart(educationPeriod.getInt("yearStart"));
        eduExperience.setYearEnd(educationPeriod.getInt("yearEnd"));
        if(hasEduExperience(eduExperience)) {
            memberExp.setEduExperience(JSONUtil.toJsonStr(Collections.singletonList(eduExperience)));
        }

        memberExp.setSkillTags(JSONUtil.toJsonStr(stringList(skills.get("skills"))));
        memberExp.setAdvantage(StrUtil.trim(advantage.getStr("advantage")));
        return memberExp;
    }

    private boolean hasWorkExperience(WorkExperienceDto dto) {
        return StrUtil.isNotBlank(dto.getCompanyFullName())
                || StrUtil.isNotBlank(dto.getJobName())
                || StrUtil.isNotBlank(dto.getWorkDetail());
    }

    private boolean hasEduExperience(EduExperienceDto dto) {
        return StrUtil.isNotBlank(dto.getSchoolName())
                || StrUtil.isNotBlank(dto.getMajor())
                || StrUtil.isNotBlank(dto.getEducationAttainment());
    }

    private void refreshLoginMember(Member updateMember) {
        AppLoginMember loginMember = tokenHelper.getAppLoginMember();
        if(loginMember == null) {
            return;
        }
        if(updateMember.getFullName() != null) {
            loginMember.setFullName(updateMember.getFullName());
        }
        if(updateMember.getGender() != null) {
            loginMember.setGender(updateMember.getGender());
        }
        if(updateMember.getBirthday() != null) {
            loginMember.setBirthday(updateMember.getBirthday());
        }
        if(updateMember.getWorkDate() != null) {
            loginMember.setWorkDate(updateMember.getWorkDate());
        }
        if(updateMember.getIdentityStatus() != null) {
            loginMember.setIdentityStatus(updateMember.getIdentityStatus());
        }
        if(updateMember.getWorkStatus() != null) {
            loginMember.setWorkStatus(updateMember.getWorkStatus());
        }
        if(updateMember.getHighestQualification() != null) {
            loginMember.setHighestQualification(updateMember.getHighestQualification());
        }
        if(updateMember.getHighestQualificationType() != null) {
            loginMember.setHighestQualificationType(updateMember.getHighestQualificationType());
        }
        if(updateMember.getAvatar() != null) {
            loginMember.setAvatar(updateMember.getAvatar());
        }
        tokenHelper.updateAppLoginMember(loginMember);
    }

    private MemberOnboarding getCurrentRecord(Long memberId) {
        return this.getOne(Wrappers.<MemberOnboarding>lambdaQuery()
                .eq(MemberOnboarding::getMemberId, memberId)
                .last("LIMIT 1"));
    }

    private MemberOnboarding newRecord(Long memberId) {
        MemberOnboarding record = new MemberOnboarding();
        record.setMemberId(memberId);
        record.setCurrentStep("");
        record.setCurrentStepIndex(0);
        record.setJobseekerCompleted(NO);
        record.setBossCompleted(NO);
        record.setStatus(ENABLED);
        record.setVersion(INIT_VERSION);
        record.setIsDeleted(NOT_DELETED);
        return record;
    }

    private OnboardingStatusResponse toStatusResponse(Long memberId, MemberOnboarding record, String selectedRole) {
        OnboardingStatusResponse response = new OnboardingStatusResponse();
        response.setMemberId(memberId);
        if(record == null) {
            response.setNextPage(PAGE_ROLE_SELECT);
            return response;
        }
        response.setRole(record.getRole());
        response.setCurrentStep(record.getCurrentStep());
        response.setCurrentStepIndex(record.getCurrentStepIndex());
        response.setJobseekerCompleted(isYes(record.getJobseekerCompleted()));
        response.setBossCompleted(isYes(record.getBossCompleted()));
        String role = StrUtil.blankToDefault(selectedRole, record.getRole());
        response.setDraft(draftMap(record, role));
        response.setNextPage(nextPage(record, role));
        return response;
    }

    private OnboardingDraftResponse toDraftResponse(Long memberId, String role, MemberOnboarding record) {
        OnboardingDraftResponse response = new OnboardingDraftResponse();
        response.setMemberId(memberId);
        response.setRole(role);
        if(record == null) {
            return response;
        }
        response.setCurrentStep(record.getCurrentStep());
        response.setCurrentStepIndex(record.getCurrentStepIndex());
        response.setDraft(draftMap(record, role));
        return response;
    }

    private String nextPage(MemberOnboarding record, String role) {
        if(StrUtil.isBlank(role)) {
            return PAGE_ROLE_SELECT;
        }
        if(ROLE_JOBSEEKER.equals(role)) {
            return isYes(record.getJobseekerCompleted()) ? PAGE_JOBSEEKER_HOME : PAGE_JOBSEEKER_ONBOARDING;
        }
        return isYes(record.getBossCompleted()) ? PAGE_BOSS_HOME : PAGE_BOSS_ONBOARDING;
    }

    private String normalizeRole(String role) {
        String normalizedRole = StrUtil.trim(role).toUpperCase();
        Assert.isTrue(ROLE_JOBSEEKER.equals(normalizedRole) || ROLE_BOSS.equals(normalizedRole), "role must be JOBSEEKER or BOSS");
        return normalizedRole;
    }

    private Map<String, Object> draftMap(MemberOnboarding record, String role) {
        if(record == null || StrUtil.isBlank(role)) {
            return new LinkedHashMap<>();
        }
        String draftJson = ROLE_BOSS.equals(role) ? record.getBossDraft() : record.getJobseekerDraft();
        if(StrUtil.isBlank(draftJson)) {
            return new LinkedHashMap<>();
        }
        JSONObject object = JSONUtil.parseObj(draftJson);
        Map<String, Object> map = new LinkedHashMap<>();
        object.forEach(map::put);
        return map;
    }

    private void setDraft(MemberOnboarding record, String role, Map<String, Object> draft) {
        String json = JSONUtil.toJsonStr(draft);
        if(ROLE_BOSS.equals(role)) {
            record.setBossDraft(json);
            return;
        }
        record.setJobseekerDraft(json);
    }

    private JSONObject step(JSONObject draft, String key) {
        JSONObject value = draft.getJSONObject(key);
        return value == null ? JSONUtil.createObj() : value;
    }

    private List<String> stringList(Object value) {
        List<String> result = new ArrayList<>();
        if(value instanceof Iterable) {
            for(Object item : (Iterable<?>) value) {
                if(item != null && StrUtil.isNotBlank(String.valueOf(item))) {
                    result.add(String.valueOf(item));
                }
            }
        } else if(value != null && StrUtil.isNotBlank(String.valueOf(value))) {
            result.add(String.valueOf(value));
        }
        return result;
    }

    private LocalDateTime monthDate(JSONObject object, String yearKey, String monthKey) {
        Integer year = object.getInt(yearKey);
        Integer month = object.getInt(monthKey);
        if(year == null || month == null || month < 1 || month > 12) {
            return null;
        }
        return LocalDateTime.of(year, month, 1, 0, 0);
    }

    private String monthText(JSONObject object, String yearKey, String monthKey) {
        Integer year = object.getInt(yearKey);
        Integer month = object.getInt(monthKey);
        if(year == null || month == null || month < 1 || month > 12) {
            return null;
        }
        return String.format("%04d-%02d", year, month);
    }

    private boolean isYes(Integer value) {
        return Integer.valueOf(YES).equals(value);
    }

    private com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<MemberOnboarding> wrapperByMemberId(Long memberId) {
        return Wrappers.<MemberOnboarding>lambdaQuery().eq(MemberOnboarding::getMemberId, memberId);
    }

    private OptionItemResponse item(String value, String label) {
        return new OptionItemResponse(value, label);
    }

    private List<OptionItemResponse> options(String... values) {
        List<OptionItemResponse> list = new ArrayList<>();
        for(String value : values) {
            list.add(item(value, value));
        }
        return list;
    }

    private List<OptionItemResponse> jobCategoryOptions() {
        return Arrays.asList(
                new OptionItemResponse("互联网/AI", "互联网/AI", options("产品经理", "AI产品经理", "Java开发", "前端开发", "测试工程师", "数据分析师")),
                new OptionItemResponse("设计", "设计", options("UI设计师", "交互设计师", "视觉设计师")),
                new OptionItemResponse("销售", "销售", options("销售专员", "客户经理", "商务BD")),
                new OptionItemResponse("服务业", "服务业", options("服务员", "门店店长", "客服专员")),
                new OptionItemResponse("制造业", "制造业", options("普工", "质检员", "机械工程师"))
        );
    }
}
