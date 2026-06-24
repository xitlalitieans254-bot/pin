const BASE_URL = 'https://zhao.zkgj.chat';
const SMS_CODE = '1234';
const LOCAL_AVATARS = [
  'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default1.png',
  'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default2.png',
  'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default3.png',
  'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png',
];

const accounts = [
  {
    phone: '12345678911',
    role: 'BOSS',
    company: {
      companyFullName: '深智未来科技有限公司',
      companyAbbrName: '深智未来',
      industry: '互联网/AI',
      companyScale: '20-99人',
      city: '长沙',
      province: '湖南',
      district: '岳麓区',
      addressDetail: '人工智能产业园 A1 栋 8 楼',
      companyDescription: '深智未来专注于 AI 产品化、企业智能助手与行业大模型落地，服务招聘、文旅、教育等高频业务场景。',
      mainBusiness: ['AI产品研发', '企业智能助手', '人才智能匹配'],
      employeeWelfare: [
        { title: '五险一金', subTitle: '入职缴纳' },
        { title: '双休', subTitle: '弹性工作' },
        { title: 'AI工具预算', subTitle: '鼓励尝试新工具' },
      ],
      restWay: 1,
      overtime: 2,
    },
    job: {
      jobName: 'AI产品经理',
      salaryRangeStart: 18,
      salaryRangeEnd: 28,
      workYearRangeStart: 3,
      workYearRangeEnd: 5,
      educationAttainment: '本科',
      jobTags: ['AI产品', '大模型', 'RAG', '社招'],
      jobDescription:
        '负责 AI 招聘产品从需求洞察到上线迭代的完整闭环，包括候选人画像、岗位匹配、智能沟通助手等模块。需要能把业务目标拆成清晰产品方案，协调算法、前端、后端和运营推进落地，并通过数据持续优化转化效率。',
    },
  },
  {
    phone: '12345678912',
    role: 'BOSS',
    company: {
      companyFullName: '云栖智能科技有限公司',
      companyAbbrName: '云栖智能',
      industry: '企业服务',
      companyScale: '100-499人',
      city: '杭州',
      province: '浙江',
      district: '余杭区',
      addressDetail: '未来科技城海创园 3 号楼 12 层',
      companyDescription: '云栖智能为企业提供 RAG 知识库、智能客服和业务自动化解决方案，正在扩大 AI 应用交付团队。',
      mainBusiness: ['RAG知识库', '智能客服', '业务流程自动化'],
      employeeWelfare: [
        { title: '年终奖', subTitle: '根据绩效发放' },
        { title: '技术分享', subTitle: '每周内部分享' },
        { title: '补充医疗', subTitle: '年度健康关怀' },
      ],
      restWay: 1,
      overtime: 2,
    },
    job: {
      jobName: 'AI应用工程师（RAG方向）',
      salaryRangeStart: 22,
      salaryRangeEnd: 35,
      workYearRangeStart: 1,
      workYearRangeEnd: 3,
      educationAttainment: '本科',
      jobTags: ['Python', 'RAG', 'LangChain', 'AI自动化'],
      jobDescription:
        '负责企业知识库问答、智能客服和 AI Agent 应用开发，包含数据清洗、向量检索、Prompt 编排、接口集成和效果评估。希望你熟悉 Python，了解大模型 API 调用，对 RAG 质量优化和工程稳定性有实践经验。',
    },
  },
  {
    phone: '12345678913',
    role: 'JOBSEEKER',
    profile: {
      job_preference: {
        isStudent: false,
        city: '长沙',
        jobs: ['AI产品经理', '产品经理', 'AI内容运营'],
        industries: ['互联网/AI'],
      },
      salary: { salaryRangeStart: 18, salaryRangeEnd: 28 },
      basic_info: { fullName: '周景行', gender: 1, birthYear: 1996, birthMonth: 5 },
      work_status: { workStatus: 3, disabledJobseeker: false },
      first_work_time: { year: 2018, month: 7 },
      recent_work: { jobName: 'AI产品经理', industry: '互联网/AI' },
      recent_company: { companyFullName: '小题旅行科技' },
      work_period: { startYear: 2022, startMonth: 3, endYear: 2026, endMonth: 5 },
      skills: { skills: ['大模型', 'Prompt', 'RAG', '需求分析', '项目管理'] },
      work_detail: {
        workDetail:
          '负责 AI 招聘与内容推荐相关产品规划，搭建候选人画像、岗位标签和智能推荐策略；推动算法、前端、后端、运营协同上线，并通过漏斗数据优化投递转化与沟通效率。',
      },
      education: { highestQualification: 4, highestQualificationType: 1 },
      school: { schoolName: '湖南大学' },
      major: { major: '软件工程' },
      education_period: { yearStart: 2014, yearEnd: 2018 },
      advantage: {
        advantage:
          '熟悉 AI 产品从 0 到 1 的落地路径，能够把复杂业务拆成可执行需求；擅长跨团队推进，关注数据结果，也能理解 RAG、Prompt 和模型能力边界。',
      },
      avatar: { avatar: LOCAL_AVATARS[0] },
    },
  },
  {
    phone: '12345678914',
    role: 'JOBSEEKER',
    profile: {
      job_preference: {
        isStudent: false,
        city: '杭州',
        jobs: ['AI应用工程师', '大模型算法工程师', '后端开发工程师'],
        industries: ['企业服务'],
      },
      salary: { salaryRangeStart: 22, salaryRangeEnd: 35 },
      basic_info: { fullName: '许安然', gender: 2, birthYear: 1995, birthMonth: 11 },
      work_status: { workStatus: 1, disabledJobseeker: false },
      first_work_time: { year: 2019, month: 7 },
      recent_work: { jobName: 'AI应用工程师', industry: '企业服务' },
      recent_company: { companyFullName: '星河数智创新' },
      work_period: { startYear: 2021, startMonth: 4, endYear: 2026, endMonth: 4 },
      skills: { skills: ['Python', 'RAG', 'AIGC', '数据分析', '大模型'] },
      work_detail: {
        workDetail:
          '负责企业知识库问答和智能客服应用开发，完成文档解析、向量检索、Prompt 编排、模型接口封装和效果评估；参与多个客户私有知识库项目交付。',
      },
      education: { highestQualification: 5, highestQualificationType: 1 },
      school: { schoolName: '浙江大学' },
      major: { major: '计算机科学与技术' },
      education_period: { yearStart: 2013, yearEnd: 2019 },
      advantage: {
        advantage:
          '具备 AI 应用工程化经验，熟悉 Python、RAG 和模型接口集成；能够兼顾效果调优与系统稳定性，对业务场景理解快，交付意识强。',
      },
      avatar: { avatar: LOCAL_AVATARS[1] },
    },
  },
];

const jobseekerSteps = [
  'job_preference',
  'salary',
  'basic_info',
  'work_status',
  'first_work_time',
  'recent_work',
  'recent_company',
  'work_period',
  'skills',
  'work_detail',
  'education',
  'school',
  'major',
  'education_period',
  'advantage',
  'avatar',
];

const bossSteps = [
  'company_name',
  'company_industry',
  'company_scale',
  'job_name',
  'job_description',
  'job_requirements',
  'job_address',
  'publish_confirm',
];

const maskToken = token => token ? `${String(token).slice(0, 8)}...` : '';

const extractUuid = payload => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  return payload.uuid
    ?? payload.loginToken
    ?? payload.login_token
    ?? payload.token
    ?? payload.smsUuid
    ?? payload.sms_uuid
    ?? payload.captchaUuid
    ?? payload.captcha_uuid
    ?? payload.captchaKey
    ?? payload.captcha_key
    ?? payload.key
    ?? payload.data?.uuid
    ?? payload.data?.loginToken
    ?? payload.data?.login_token
    ?? payload.data?.token
    ?? payload.data?.smsUuid
    ?? payload.data?.sms_uuid
    ?? payload.data?.captchaUuid
    ?? payload.data?.captcha_uuid
    ?? payload.data?.captchaKey
    ?? payload.data?.captcha_key
    ?? payload.data?.key
    ?? '';
};

const extractToken = payload => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  return payload.token
    ?? payload.accessToken
    ?? payload.access_token
    ?? payload.loginToken
    ?? payload.data?.token
    ?? '';
};

const assertOk = (name, data) => {
  if (!data || data.code !== 0) {
    throw new Error(`${name} failed: ${JSON.stringify(data)}`);
  }
  return data;
};

const request = async (path, {
  method = 'GET',
  body,
  token,
  query,
  allowBusinessFailure = false,
} = {}) => {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} HTTP ${res.status}: ${text}`);
  }

  if (!allowBusinessFailure && data?.code !== undefined && data.code !== 0) {
    throw new Error(`${method} ${path} business error: ${JSON.stringify(data)}`);
  }

  return data;
};

const login = async phone => {
  const captcha = assertOk('sendSmsCaptcha', await request('/member/api/login/sms-captcha', {
    method: 'POST',
    body: { phone },
  }));
  const uuid = extractUuid(captcha.data ?? captcha);
  if (!uuid) {
    throw new Error(`No login uuid for ${phone}: ${JSON.stringify(captcha)}`);
  }

  const loginRes = assertOk('smsLogin', await request('/member/api/login/sms', {
    method: 'POST',
    body: { phone, smsCode: SMS_CODE, uuid },
  }));
  const token = extractToken(loginRes.data);
  if (!token) {
    throw new Error(`No token for ${phone}: ${JSON.stringify(loginRes)}`);
  }

  return token;
};

const saveDraft = async (token, role, stepKey, stepIndex, stepData) => {
  await request('/member/api/onboarding/draft/save', {
    method: 'POST',
    token,
    body: { role, stepKey, stepIndex, stepData },
  });
};

const chooseRole = async (token, role) => {
  await request('/member/api/onboarding/role', {
    method: 'POST',
    token,
    body: { role },
  });
};

const completeRole = async (token, role) => {
  await request('/member/api/onboarding/complete', {
    method: 'POST',
    token,
    body: { role },
  });
};

const buildCompanyPayload = account => {
  const { company } = account;
  return {
    companyFullName: company.companyFullName,
    companyAbbrName: company.companyAbbrName,
    companyLogo: LOCAL_AVATARS[3],
    companyDescription: company.companyDescription,
    companyScale: company.companyScale,
    financingStage: '未融资',
    industry: company.industry,
    restWay: company.restWay,
    overtime: company.overtime,
    photo: [],
    employeeWelfare: company.employeeWelfare,
    mainBusiness: company.mainBusiness,
    country: '中国',
    province: company.province,
    city: company.city,
    district: company.district,
    addressDetail: company.addressDetail,
  };
};

const buildJobPayload = account => {
  const { company, job } = account;
  return {
    jobName: job.jobName,
    salaryRangeStart: job.salaryRangeStart,
    salaryRangeEnd: job.salaryRangeEnd,
    workYearRangeStart: job.workYearRangeStart,
    workYearRangeEnd: job.workYearRangeEnd,
    educationAttainment: job.educationAttainment,
    jobTags: JSON.stringify(job.jobTags),
    jobDescription: job.jobDescription,
    country: '中国',
    province: company.province,
    city: company.city,
    district: company.district,
    addressDetail: company.addressDetail,
    status: 1,
  };
};

const seedJobseeker = async (account, token) => {
  await chooseRole(token, 'JOBSEEKER');
  for (const [index, stepKey] of jobseekerSteps.entries()) {
    await saveDraft(token, 'JOBSEEKER', stepKey, index + 1, account.profile[stepKey]);
  }
  await completeRole(token, 'JOBSEEKER');
  const resume = await request('/member/api/online/resume/info', {
    method: 'POST',
    token,
    body: {},
    allowBusinessFailure: true,
  });

  return {
    phone: account.phone,
    name: account.profile.basic_info.fullName,
    expectedJobs: account.profile.job_preference.jobs,
    resumeCode: resume?.code,
    resumeHasData: Boolean(resume?.data),
  };
};

const seedBoss = async (account, token) => {
  await chooseRole(token, 'BOSS');
  const draft = {
    company_name: {
      companyFullName: account.company.companyFullName,
      businessLicense: '',
    },
    company_industry: { industry: account.company.industry },
    company_scale: { companyScale: account.company.companyScale },
    job_name: { jobName: account.job.jobName },
    job_description: { jobDescription: account.job.jobDescription },
    job_requirements: {
      experienceLabel: `${account.job.workYearRangeStart}-${account.job.workYearRangeEnd}年`,
      workYearRangeStart: account.job.workYearRangeStart,
      workYearRangeEnd: account.job.workYearRangeEnd,
      educationAttainment: account.job.educationAttainment,
      salaryRangeStart: account.job.salaryRangeStart,
      salaryRangeEnd: account.job.salaryRangeEnd,
      jobTags: account.job.jobTags.join('、'),
    },
    job_address: {
      city: account.company.city,
      addressDetail: account.company.addressDetail,
    },
    publish_confirm: {},
  };

  for (const [index, stepKey] of bossSteps.entries()) {
    await saveDraft(token, 'BOSS', stepKey, index + 1, draft[stepKey]);
  }

  const companyRes = await request('/job/api/company/my/save', {
    method: 'POST',
    token,
    body: buildCompanyPayload(account),
  });

  const jobRes = await request('/job/api/job/boss/save', {
    method: 'POST',
    token,
    body: buildJobPayload(account),
  });

  await completeRole(token, 'BOSS');

  const myCompany = await request('/job/api/company/my', { token, allowBusinessFailure: true });
  const myJobs = await request('/job/api/job/boss/list', {
    method: 'POST',
    token,
    body: { page: 1, size: 10 },
    allowBusinessFailure: true,
  });

  return {
    phone: account.phone,
    company: account.company.companyFullName,
    jobName: account.job.jobName,
    companyCode: companyRes?.code,
    jobCode: jobRes?.code,
    myCompanyCode: myCompany?.code,
    myJobCount: myJobs?.data?.list?.length ?? 0,
  };
};

const verifyPlatform = async ({ bossTokens, jobseekerTokens }) => {
  const bossToken = bossTokens[0];
  const jobseekerToken = jobseekerTokens[0];

  const talentList = await request('/member/api/boss/member/list', {
    method: 'POST',
    token: bossToken,
    body: { page: 1, size: 50 },
    allowBusinessFailure: true,
  });
  const jobs = await request('/job/api/job/recommend/list', {
    token: jobseekerToken,
    query: { page: 1, size: 50 },
    allowBusinessFailure: true,
  });

  const talentNames = (talentList?.data?.list || []).map(item => String(item.fullName || ''));
  const jobNames = (jobs?.data?.list || []).map(item => ({
    jobName: String(item.jobName || ''),
    company: String(item.companyResponse?.companyFullName || item.companyResponse?.companyAbbrName || ''),
  }));

  return {
    talentListCode: talentList?.code,
    talentListTotal: talentList?.data?.total ?? talentNames.length,
    seededTalentVisible: ['周景行', '许安然'].filter(name => talentNames.includes(name)),
    jobListCode: jobs?.code,
    jobListTotal: jobs?.data?.total ?? jobNames.length,
    seededJobsVisible: ['AI产品经理', 'AI应用工程师（RAG方向）'].filter(name => (
      jobNames.some(item => item.jobName === name)
    )),
  };
};

const main = async () => {
  const tokensByPhone = new Map();
  const summaries = [];
  const bossTokens = [];
  const jobseekerTokens = [];

  for (const account of accounts) {
    console.log(`\n== ${account.phone} ${account.role} ==`);
    const token = await login(account.phone);
    tokensByPhone.set(account.phone, token);
    console.log(`login ok token=${maskToken(token)}`);

    const statusBefore = await request('/member/api/onboarding/status', {
      token,
      allowBusinessFailure: true,
    });
    console.log(`status before nextPage=${statusBefore?.data?.nextPage || ''}`);

    if (account.role === 'BOSS') {
      const summary = await seedBoss(account, token);
      summaries.push(summary);
      bossTokens.push(token);
      console.log(`seed boss ok company=${summary.company} job=${summary.jobName} myJobCount=${summary.myJobCount}`);
    } else {
      const summary = await seedJobseeker(account, token);
      summaries.push(summary);
      jobseekerTokens.push(token);
      console.log(`seed jobseeker ok name=${summary.name} jobs=${summary.expectedJobs.join('、')} resume=${summary.resumeHasData}`);
    }

    const statusAfter = await request('/member/api/onboarding/status', {
      token,
      allowBusinessFailure: true,
    });
    console.log(`status after nextPage=${statusAfter?.data?.nextPage || ''} role=${statusAfter?.data?.role || ''}`);
  }

  const verification = await verifyPlatform({ bossTokens, jobseekerTokens });

  console.log('\n== summary ==');
  console.log(JSON.stringify({ summaries, verification }, null, 2));
};

main().catch(error => {
  console.error('\nSeed failed');
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
