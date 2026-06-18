# 登录后身份选择与新用户引导接口

本文档给 `ttZhipinApp` 前端使用。所有接口都走网关，成功响应统一为：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

需要登录的接口都带：

```http
Authorization: Bearer <token>
```

## 总流程

1. 手机号验证码登录成功后，调用 `GET /member/api/onboarding/status`。
2. 根据 `data.nextPage` 跳页面：
   - `ROLE_SELECT`：身份选择页。
   - `JOBSEEKER_ONBOARDING`：求职者资料引导页。
   - `BOSS_ONBOARDING`：招聘方资料引导页。
   - `JOBSEEKER_HOME`：求职首页。
   - `BOSS_HOME`：招聘方首页。
3. 用户选择身份后，调用 `POST /member/api/onboarding/role`。
4. 每个下一步都调用 `POST /member/api/onboarding/draft/save` 保存当前页草稿。
5. 最后一步调用 `POST /member/api/onboarding/complete`。求职者会把草稿落到在线简历相关表；招聘方会标记引导完成并保持招聘方身份。

## Onboarding 接口

### 获取当前状态

`GET /member/api/onboarding/status`

返回 `data`：

```json
{
  "memberId": 123,
  "role": "JOBSEEKER",
  "currentStep": "basic_info",
  "currentStepIndex": 3,
  "jobseekerCompleted": false,
  "bossCompleted": false,
  "nextPage": "JOBSEEKER_ONBOARDING",
  "draft": {}
}
```

### 选择身份

`POST /member/api/onboarding/role`

```json
{
  "role": "JOBSEEKER"
}
```

`role` 可选：

- `JOBSEEKER`：我要找工作
- `BOSS`：我要招人

选择 `BOSS` 时，后端会同步把当前用户切成招聘方身份。

### 获取草稿

`GET /member/api/onboarding/draft?role=JOBSEEKER`

`role` 支持 `JOBSEEKER` 或 `BOSS`。

### 保存一步草稿

`POST /member/api/onboarding/draft/save`

```json
{
  "role": "JOBSEEKER",
  "stepKey": "basic_info",
  "stepIndex": 3,
  "stepData": {
    "fullName": "张三",
    "gender": 1,
    "birthYear": 1992,
    "birthMonth": 8
  }
}
```

后端会把 `stepData` 按 `stepKey` 合并进该角色草稿。重复保存同一个 `stepKey` 会覆盖该步骤。

### 完成引导

`POST /member/api/onboarding/complete`

```json
{
  "role": "JOBSEEKER"
}
```

求职者完成时会校验：

- 期望职位最多 3 个。
- 技能最多 5 个。
- 最高薪资不能小于最低薪资。
- 如果填写了出生年月，必须年满 18 周岁。

### 获取选项

`GET /member/api/onboarding/options`

返回角色、求职者步骤、招聘方步骤、城市、职位分类、行业、技能、学历、公司规模、薪资范围、虚拟头像等选项。职位分类是左右两栏结构：一级类别在左，`children` 是右侧具体岗位。

## 求职者 stepKey 与字段

`job_preference`

```json
{
  "isStudent": true,
  "city": "泉州",
  "jobs": ["产品经理", "AI产品经理"],
  "industries": ["互联网/AI"]
}
```

`salary`

```json
{
  "salaryRangeStart": 10,
  "salaryRangeEnd": 20
}
```

单位是 K，`10` 表示 `10K`。

`basic_info`

```json
{
  "fullName": "张三",
  "gender": 1,
  "birthYear": 1992,
  "birthMonth": 8
}
```

`gender`：`1` 男，`2` 女。

`work_status`

```json
{
  "workStatus": 1
}
```

`first_work_time`

```json
{
  "year": 2015,
  "month": 6
}
```

`recent_work`

```json
{
  "jobName": "产品经理",
  "industry": "互联网/AI"
}
```

`recent_company`

```json
{
  "companyFullName": "AI智聘科技"
}
```

`work_period`

```json
{
  "startYear": 2020,
  "startMonth": 1,
  "endYear": 2024,
  "endMonth": 12
}
```

`skills`

```json
{
  "skills": ["需求分析", "项目管理"]
}
```

最多 5 个。

`work_detail`

```json
{
  "workDetail": "负责招聘产品规划"
}
```

`education`

```json
{
  "highestQualification": 5,
  "highestQualificationType": 1
}
```

`highestQualificationType`：`1` 全日制，`2` 非全日制。

`school`

```json
{
  "schoolName": "福建师范大学"
}
```

`major`

```json
{
  "major": "信息管理"
}
```

`education_period`

```json
{
  "yearStart": 2010,
  "yearEnd": 2014
}
```

`advantage`

```json
{
  "advantage": "沟通能力强，能快速推进跨团队项目"
}
```

`avatar`

```json
{
  "avatar": "https://example.com/avatar.png"
}
```

头像可以先调用文件上传接口，或直接选择 `options.virtualAvatars` 中的虚拟头像地址。

## 招聘方流程

招聘方身份选择与草稿保存仍走 onboarding：

- `company_name`
- `company_industry`
- `company_scale`
- `job_name`
- `job_description`
- `job_requirements`
- `job_address`
- `publish_confirm`

招聘方正式数据走现有接口：

1. 保存企业资料：`POST /job/api/company/my/save`
2. 获取企业资料：`GET /job/api/company/my`
3. 发布/编辑职位：`POST /job/api/job/boss/save`
4. 我的职位列表：`POST /job/api/job/boss/list`

保存企业资料示例：

```json
{
  "companyFullName": "AI智聘科技有限公司",
  "companyAbbrName": "AI智聘",
  "companyLogo": "https://example.com/logo.png",
  "companyScale": "20-99人",
  "industry": "互联网/AI",
  "city": "泉州",
  "addressDetail": "软件园 1 号楼"
}
```

发布职位示例：

```json
{
  "jobName": "产品经理",
  "salaryRangeStart": 10,
  "salaryRangeEnd": 20,
  "workYearRangeStart": 1,
  "workYearRangeEnd": 3,
  "educationAttainment": "本科",
  "jobTags": "社招,双休",
  "jobDescription": "负责 AI 招聘产品规划和需求推进",
  "city": "泉州",
  "addressDetail": "软件园 1 号楼",
  "status": 1
}
```

如果当前招聘方已经保存过企业资料，发布职位时可以不传 `companyId`，后端会使用当前招聘方自己的公司。

## 图片上传

头像、公司 logo、营业执照图片都可以先调用：

`POST /file/api/file/upload`

表单字段：

- `file`：文件
- `objectId`：可选，业务对象 ID
- `objectType`：可选，例如 `avatar`、`company_logo`、`business_license`

返回：

```json
{
  "url": "https://example.com/upload/a.png",
  "filename": "a.png",
  "originalFilename": "license.png"
}
```

营业执照 OCR 目前还没有接第三方识别服务。前端第一版可以先上传图片，把识别/手输后的公司名保存到 onboarding 草稿和企业资料接口里。
