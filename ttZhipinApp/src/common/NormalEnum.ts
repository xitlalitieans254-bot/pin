const educationMap: Record<number, string> = {
    1: '初中及以下',
    2: '中专/中技',
    3: '高中',
    4: '大专',
    5: '本科',
    6: '硕士',
    7: '博士',
};

export function getChineseEducation(level?: number | string | null): string {
    const educationLevel = Number(level);
    return educationMap[educationLevel] || '';
}

const jobStatusMap: Record<number, string> = {
    1: '离校-随时到岗',
    2: '在校-月内到岗',
    3: '在校-考虑机会',
    4: '在校-暂不考虑',
    5: '离职-随时到岗',
    6: '在职-月内到岗',
    7: '在职-考虑机会',
    8: '在职-暂不考虑',
  };
  
export function getJobStatus(status?: number | string | null): string {
    const jobStatusValue = Number(status);
    return jobStatusMap[jobStatusValue] || '';
  }


  const educationTypeMap: Record<number, string> = {
    1: '全日制',
    2: '非全日制',
  };
  
 export function getEducationType(type?: number | string | null): string {
    const educationTypeValue = Number(type);
    return educationTypeMap[educationTypeValue] || '';
  }
