import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const OPERATION: AppRouteRecordRaw = {
  path: '/operation',
  name: 'Operation',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: '运营管理',
    requiresAuth: true,
    icon: 'icon-apps',
    order: 1,
  },
  children: [
    {
      path: 'member',
      name: 'OperationMember',
      component: () => import('@/views/operation/member/index.vue'),
      meta: {
        locale: '会员管理',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'company',
      name: 'OperationCompany',
      component: () => import('@/views/operation/company/index.vue'),
      meta: {
        locale: '企业管理',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'job',
      name: 'OperationJob',
      component: () => import('@/views/operation/job/index.vue'),
      meta: {
        locale: '职位管理',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default OPERATION;
