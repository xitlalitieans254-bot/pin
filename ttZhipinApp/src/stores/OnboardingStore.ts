import { action, observable } from 'mobx';
import ApiService from '../apis/ApiService';
import apis from '../apis/apis';

export type OnboardingRole = 'JOBSEEKER' | 'BOSS';

export type OnboardingNextPage =
  | 'ROLE_SELECT'
  | 'JOBSEEKER_ONBOARDING'
  | 'BOSS_ONBOARDING'
  | 'JOBSEEKER_HOME'
  | 'BOSS_HOME';

export type OnboardingStatus = {
  memberId?: string;
  role?: OnboardingRole;
  currentStep?: string;
  currentStepIndex?: number;
  jobseekerCompleted?: boolean;
  bossCompleted?: boolean;
  nextPage?: OnboardingNextPage;
  draft?: any;
};

export type OnboardingOptionItem = {
  label: string;
  value: string;
  children?: OnboardingOptionItem[];
};

export type OnboardingOptions = {
  cities: OnboardingOptionItem[];
  jobCategories: OnboardingOptionItem[];
  industries: OnboardingOptionItem[];
  skills: OnboardingOptionItem[];
  educations: OnboardingOptionItem[];
  companyScales: OnboardingOptionItem[];
  workStatuses: OnboardingOptionItem[];
  salaryRanges: number[];
  virtualAvatars: string[];
};

const makeItem = (label: string, value?: string): OnboardingOptionItem => ({
  label,
  value: value || label,
});

const fallbackOptions: OnboardingOptions = {
  cities: ['北京', '上海', '深圳', '广州', '杭州', '长沙', '厦门', '泉州', '成都', '武汉'].map(item => makeItem(item)),
  jobCategories: [
    {
      label: '产品',
      value: '产品',
      children: ['AI产品经理', '产品经理', '产品运营', '增长产品'].map(item => makeItem(item)),
    },
    {
      label: '技术',
      value: '技术',
      children: ['AI应用工程师', '大模型算法工程师', '前端开发工程师', '后端开发工程师', '移动端工程师'].map(item => makeItem(item)),
    },
    {
      label: '设计',
      value: '设计',
      children: ['AI视觉设计师', 'UI设计师', '交互设计师', '产品设计师'].map(item => makeItem(item)),
    },
    {
      label: '运营',
      value: '运营',
      children: ['AI内容运营', '用户运营', '社群运营', '增长运营'].map(item => makeItem(item)),
    },
    {
      label: '销售',
      value: '销售',
      children: ['AI解决方案销售', '客户经理', '商务拓展', '销售顾问'].map(item => makeItem(item)),
    },
  ],
  industries: ['互联网/AI', '企业服务', '智能制造', '教育培训', '医疗健康', '电商/消费', '金融科技'].map(item => makeItem(item)),
  skills: ['大模型', 'Prompt', 'RAG', 'Python', 'React Native', '产品规划', '需求分析', '项目管理', '数据分析', 'AIGC'].map(item => makeItem(item)),
  educations: [
    makeItem('初中及以下', '1'),
    makeItem('高中', '2'),
    makeItem('大专', '3'),
    makeItem('本科', '4'),
    makeItem('硕士', '5'),
    makeItem('博士', '6'),
  ],
  companyScales: ['0-20人', '20-99人', '100-499人', '500-999人', '1000-9999人', '10000人以上'].map(item => makeItem(item)),
  workStatuses: [
    makeItem('离职-随时到岗', '1'),
    makeItem('在职-月内到岗', '2'),
    makeItem('在职-考虑机会', '3'),
    makeItem('在职-暂不考虑', '4'),
  ],
  salaryRanges: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50],
  virtualAvatars: [],
};

const normalizeText = (value: any): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const normalizeItems = (value: any, fallback: OnboardingOptionItem[] = []): OnboardingOptionItem[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value.map((item: any) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return makeItem(String(item));
    }

    const label = normalizeText(item.label ?? item.name ?? item.title ?? item.text ?? item.value);
    const optionValue = normalizeText(item.value ?? item.code ?? item.id ?? label);
    const children = normalizeItems(item.children ?? item.childList ?? item.list, []);

    return {
      label: label || optionValue,
      value: optionValue || label,
      children,
    };
  }).filter((item: OnboardingOptionItem) => item.label && item.value);
};

const normalizeSalaryRanges = (value: any): number[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return fallbackOptions.salaryRanges;
  }

  const ranges = value
    .map((item: any) => Number(item?.value ?? item))
    .filter((item: number) => Number.isFinite(item) && item > 0);

  return ranges.length > 0 ? ranges : fallbackOptions.salaryRanges;
};

const normalizeVirtualAvatars = (value: any): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: any) => normalizeText(item?.url ?? item?.avatar ?? item?.value ?? item))
    .filter(Boolean);
};

export const normalizeOnboardingOptions = (payload: any): OnboardingOptions => {
  const data = payload || {};

  return {
    cities: normalizeItems(data.cities ?? data.cityList, fallbackOptions.cities),
    jobCategories: normalizeItems(data.jobCategories ?? data.jobCategoryList ?? data.jobs, fallbackOptions.jobCategories),
    industries: normalizeItems(data.industries ?? data.industryList, fallbackOptions.industries),
    skills: normalizeItems(data.skills ?? data.skillList, fallbackOptions.skills),
    educations: normalizeItems(data.educations ?? data.educationList ?? data.highestQualifications, fallbackOptions.educations),
    companyScales: normalizeItems(data.companyScales ?? data.companyScaleList, fallbackOptions.companyScales),
    workStatuses: normalizeItems(data.workStatuses ?? data.workStatusList, fallbackOptions.workStatuses),
    salaryRanges: normalizeSalaryRanges(data.salaryRanges ?? data.salaryRangeList),
    virtualAvatars: normalizeVirtualAvatars(data.virtualAvatars ?? data.avatarList),
  };
};

export default class OnboardingStore {
  //@ts-ignore
  @observable status: OnboardingStatus = {};

  //@ts-ignore
  @observable options: OnboardingOptions = fallbackOptions;

  //@ts-ignore
  @observable loading: boolean = false;

  //@ts-ignore
  @action
  requestStatus = async () => {
    const { data } = await ApiService.request('onboardingStatus');
    if (data?.code === 0) {
      this.status = {
        ...data.data,
        memberId: data.data?.memberId ? String(data.data.memberId) : undefined,
      };
    }
    return data;
  };

  selectRole = async (role: OnboardingRole) => {
    const { data } = await ApiService.request('onboardingRole', { role });
    return data;
  };

  requestDraft = async (role: OnboardingRole) => {
    const { data } = await ApiService.request('onboardingDraft', { role });
    return data;
  };

  saveDraft = async (role: OnboardingRole, stepKey: string, stepIndex: number, stepData: any) => {
    const { data } = await ApiService.request('onboardingDraftSave', {
      role,
      stepKey,
      stepIndex,
      stepData,
    });
    return data;
  };

  complete = async (role: OnboardingRole) => {
    const { data } = await ApiService.request('onboardingComplete', { role });
    return data;
  };

  requestOptions = async () => {
    const { data } = await ApiService.request('onboardingOptions');
    if (data?.code === 0) {
      this.options = normalizeOnboardingOptions(data.data || {});
    }
    return data;
  };

  saveCompany = async (params: any) => {
    const { data } = await ApiService.request('saveMyCompany', params);
    return data;
  };

  saveBossJob = async (params: any) => {
    const normalizedParams = {
      ...params,
      id: params?.id ? String(params.id) : undefined,
      companyId: params?.companyId ? String(params.companyId) : undefined,
    };
    const { data } = await ApiService.request('saveBossJob', normalizedParams);
    return data;
  };

  submitToutouLicense = async (businessLicense: string) => {
    const { data } = await ApiService.request('submitToutouLicense', { businessLicense });
    return data;
  };

  uploadFile = async (uri: string, fileName: string, fileType: string) => {
    const { data } = await ApiService.upload(apis.fileUpload.url, uri, fileName, fileType);
    if (data?.code !== 0) {
      return '';
    }

    const payload = data.data;
    if (typeof payload === 'string') {
      return payload;
    }

    return payload?.url || '';
  };
}
