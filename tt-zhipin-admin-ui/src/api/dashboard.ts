import type { TableData } from '@arco-design/web-vue/es/table/interface';

export interface ContentDataRecord {
  x: string;
  y: number;
}

const contentData: ContentDataRecord[] = [
  { x: '06-18', y: 58 },
  { x: '06-19', y: 81 },
  { x: '06-20', y: 53 },
  { x: '06-21', y: 90 },
  { x: '06-22', y: 64 },
  { x: '06-23', y: 88 },
  { x: '06-24', y: 49 },
  { x: '06-25', y: 79 },
];

export function queryContentData() {
  return Promise.resolve({ data: contentData });
}

export interface PopularRecord {
  key: number;
  clickNumber: string;
  title: string;
  increases: number;
}

const popularLists: Record<string, TableData[]> = {
  text: [
    { key: 1, title: 'AI智聘岗位浏览趋势', clickNumber: '36.8w+', increases: 18 },
    { key: 2, title: '招聘方发布职位数据', clickNumber: '24.5w+', increases: 12 },
    { key: 3, title: '候选人简历完善情况', clickNumber: '18.2w+', increases: 8 },
  ],
  image: [
    { key: 1, title: '企业认证资料审核', clickNumber: '9.6w+', increases: 6 },
    { key: 2, title: '公司照片上传统计', clickNumber: '7.2w+', increases: 3 },
  ],
  video: [
    { key: 1, title: '招聘沟通转化数据', clickNumber: '12.4w+', increases: 9 },
    { key: 2, title: '职位推荐点击表现', clickNumber: '10.1w+', increases: 5 },
  ],
};

export function queryPopularList(params: { type: string }) {
  return Promise.resolve({ data: popularLists[params.type] || popularLists.text });
}
