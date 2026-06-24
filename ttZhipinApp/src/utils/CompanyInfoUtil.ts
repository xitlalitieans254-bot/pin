export type CompanyInfo = Partial<JobEntity['companyResponse']> & {
  [key: string]: unknown;
  businessLicense?: string;
};

export const REQUIRED_COMPANY_FIELDS = [
  { key: 'companyFullName', label: '公司全称' },
  { key: 'companyAbbrName', label: '公司简称' },
  { key: 'industry', label: '所属行业' },
  { key: 'companyScale', label: '公司规模' },
  { key: 'financingStage', label: '融资阶段' },
  { key: 'city', label: '所在城市' },
  { key: 'district', label: '所在区域' },
  { key: 'addressDetail', label: '详细地址' },
  { key: 'companyDescription', label: '公司介绍' },
  { key: 'mainBusiness', label: '主营业务' },
] as const;

export const toCompanyText = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

export const isEmptyCompanyInfoValue = (value: unknown): boolean => {
  return toCompanyText(value).length === 0;
};

export const getMissingCompanyInfoLabels = (companyInfo?: CompanyInfo | null): string[] => {
  const company = companyInfo || {};
  return REQUIRED_COMPANY_FIELDS
    .filter(field => isEmptyCompanyInfoValue(company[field.key]))
    .map(field => field.label);
};

export const isCompanyInfoComplete = (companyInfo?: CompanyInfo | null): boolean => {
  return getMissingCompanyInfoLabels(companyInfo).length === 0;
};
