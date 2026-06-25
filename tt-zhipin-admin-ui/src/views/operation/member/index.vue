<template>
  <div class="container">
    <Breadcrumb :items="['运营管理', '会员管理']" />
    <a-card class="general-card" title="会员管理">
      <div class="toolbar">
        <a-form :model="queryParams" layout="inline">
          <a-form-item hide-label>
            <a-input
              v-model="queryParams.keyword"
              placeholder="手机号 / 姓名 / 邮箱"
              allow-clear
              style="width: 220px"
              @press-enter="handleQuery"
            />
          </a-form-item>
          <a-form-item hide-label>
            <a-select
              v-model="queryParams.status"
              :options="statusOptions"
              placeholder="状态"
              allow-clear
              style="width: 120px"
            />
          </a-form-item>
          <a-form-item hide-label>
            <a-select
              v-model="queryParams.identityStatus"
              :options="identityOptions"
              placeholder="身份"
              allow-clear
              style="width: 130px"
            />
          </a-form-item>
          <a-form-item hide-label>
            <a-select
              v-model="queryParams.isToutou"
              :options="bossOptions"
              placeholder="招聘者"
              allow-clear
              style="width: 130px"
            />
          </a-form-item>
          <a-form-item hide-label>
            <a-space>
              <a-button type="primary" @click="handleQuery">
                <template #icon><icon-search /></template>
                查询
              </a-button>
              <a-button @click="resetQuery">
                <template #icon><icon-refresh /></template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <a-table
        row-key="id"
        :data="memberList"
        :loading="loading"
        :bordered="false"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="100" />
          <a-table-column title="会员" :width="220">
            <template #cell="{ record }">
              <a-space>
                <a-avatar :size="32">
                  <img v-if="record.avatar" :src="record.avatar" alt="avatar" />
                  <span v-else>{{ avatarText(record) }}</span>
                </a-avatar>
                <div>
                  <a-link @click="openDetail(record.id)">{{ emptyText(record.fullName || record.phone) }}</a-link>
                  <div class="sub-text">{{ emptyText(record.phone) }}</div>
                </div>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="身份" :width="110">
            <template #cell="{ record }">
              <a-tag>{{ identityText(record.identityStatus) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="招聘者" :width="110">
            <template #cell="{ record }">
              <a-tag :color="record.isToutou === 1 ? 'blue' : 'gray'">
                {{ record.isToutou === 1 ? '是' : '否' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="求职状态" :width="160">
            <template #cell="{ record }">{{ workStatusText(record.workStatus) }}</template>
          </a-table-column>
          <a-table-column title="城市" :width="140">
            <template #cell="{ record }">{{ compactLocation(record) }}</template>
          </a-table-column>
          <a-table-column title="最近登录" data-index="lastLogin" :width="170" />
          <a-table-column title="注册时间" data-index="createdAt" :width="170" />
          <a-table-column title="状态" align="center" :width="100">
            <template #cell="{ record }">
              <a-switch
                v-model="record.status"
                :checked-value="1"
                :unchecked-value="0"
                @change="(value) => handleStatusChange(record, Number(value))"
              />
            </template>
          </a-table-column>
          <a-table-column title="操作" align="center" fixed="right" :width="90">
            <template #cell="{ record }">
              <a-button type="text" size="small" title="详情" @click="openDetail(record.id)">
                <template #icon><icon-eye /></template>
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      title="会员详情"
      :visible="detailVisible"
      :width="720"
      :footer="false"
      unmount-on-close
      render-to-body
      @cancel="detailVisible = false"
    >
      <a-spin :loading="detailLoading" style="width: 100%">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="会员ID">{{ emptyText(memberDetail.id) }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ emptyText(memberDetail.phone) }}</a-descriptions-item>
          <a-descriptions-item label="姓名">{{ emptyText(memberDetail.fullName) }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ emptyText(memberDetail.email) }}</a-descriptions-item>
          <a-descriptions-item label="性别">{{ genderText(memberDetail.gender) }}</a-descriptions-item>
          <a-descriptions-item label="生日">{{ emptyText(memberDetail.birthday) }}</a-descriptions-item>
          <a-descriptions-item label="身份">{{ identityText(memberDetail.identityStatus) }}</a-descriptions-item>
          <a-descriptions-item label="求职状态">{{ workStatusText(memberDetail.workStatus) }}</a-descriptions-item>
          <a-descriptions-item label="招聘者">{{ memberDetail.isToutou === 1 ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="账号状态">{{ statusText(memberDetail.status) }}</a-descriptions-item>
          <a-descriptions-item label="最高学历">{{ educationText(memberDetail.highestQualification) }}</a-descriptions-item>
          <a-descriptions-item label="学历类型">{{ qualificationTypeText(memberDetail.highestQualificationType) }}</a-descriptions-item>
          <a-descriptions-item label="工作时间">{{ emptyText(memberDetail.workDate) }}</a-descriptions-item>
          <a-descriptions-item label="地区">{{ compactLocation(memberDetail) }}</a-descriptions-item>
          <a-descriptions-item label="IP">{{ emptyText(memberDetail.ip) }}</a-descriptions-item>
          <a-descriptions-item label="登录次数">{{ emptyText(memberDetail.loginCount) }}</a-descriptions-item>
          <a-descriptions-item label="最近登录">{{ emptyText(memberDetail.lastLogin) }}</a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ emptyText(memberDetail.createdAt) }}</a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import useLoading from '@/hooks/loading';
  import {
    getOperationMember,
    OperationMemberQuery,
    OperationMemberResponse,
    pageOperationMember,
    updateOperationMemberStatus,
  } from '@/api/operation/member';

  const { loading, setLoading } = useLoading(false);

  const queryParams = reactive<OperationMemberQuery>({
    page: 1,
    size: 10,
  });

  const statusOptions = [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ];

  const identityOptions = [
    { label: '职场人', value: 1 },
    { label: '学生', value: 2 },
  ];

  const bossOptions = [
    { label: '是', value: 1 },
    { label: '否', value: 0 },
  ];

  const memberList = ref<OperationMemberResponse[]>([]);
  const total = ref(0);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const memberDetail = ref<OperationMemberResponse>({});

  const pagination = computed(() => ({
    showTotal: true,
    showPageSize: true,
    total: total.value,
    current: queryParams.page,
    pageSize: queryParams.size,
  }));

  const fetchData = () => {
    setLoading(true);
    pageOperationMember({ ...queryParams })
      .then((res) => {
        memberList.value = res.data.list || [];
        total.value = Number(res.data.total || 0);
      })
      .finally(() => setLoading(false));
  };

  const handleQuery = () => {
    queryParams.page = 1;
    fetchData();
  };

  const resetQuery = () => {
    queryParams.keyword = undefined;
    queryParams.status = undefined;
    queryParams.identityStatus = undefined;
    queryParams.isToutou = undefined;
    handleQuery();
  };

  const handlePageChange = (page: number) => {
    queryParams.page = page;
    fetchData();
  };

  const handlePageSizeChange = (size: number) => {
    queryParams.size = size;
    queryParams.page = 1;
    fetchData();
  };

  const handleStatusChange = (record: OperationMemberResponse, status: number) => {
    if (!record.id) return;
    const previousStatus = status === 1 ? 0 : 1;
    updateOperationMemberStatus(record.id, status)
      .then(() => {
        Message.success(status === 1 ? '会员已启用' : '会员已禁用');
      })
      .catch(() => {
        record.status = previousStatus;
      });
  };

  const openDetail = (id?: number) => {
    if (!id) return;
    detailVisible.value = true;
    detailLoading.value = true;
    getOperationMember(id)
      .then((res) => {
        memberDetail.value = res.data || {};
      })
      .finally(() => {
        detailLoading.value = false;
      });
  };

  const emptyText = (value: unknown) => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const avatarText = (record: OperationMemberResponse) => {
    const text = record.fullName || record.phone || '会';
    return text.slice(0, 1);
  };

  const statusText = (status?: number) => (status === 1 ? '启用' : '禁用');
  const identityText = (status?: number) => ({ 1: '职场人', 2: '学生' }[Number(status)] || '未设置');
  const genderText = (gender?: number) => ({ 1: '男', 2: '女', 3: '未知' }[Number(gender)] || '未设置');
  const qualificationTypeText = (value?: number) => ({ 1: '全日制', 2: '非全日制' }[Number(value)] || '未设置');
  const educationText = (value?: number) =>
    ({
      1: '初中及以下',
      2: '中专/中技',
      3: '高中',
      4: '大专',
      5: '本科',
      6: '硕士',
      7: '博士',
    }[Number(value)] || '未设置');
  const workStatusText = (value?: number) =>
    ({
      1: '离职-随时到岗',
      2: '在职-月内到岗',
      3: '在职-考虑机会',
      4: '在职-暂不考虑',
    }[Number(value)] || '未设置');

  const compactLocation = (record: OperationMemberResponse) =>
    [record.province, record.city, record.district].filter(Boolean).join(' / ') || '-';

  fetchData();
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px;
  }

  .toolbar {
    padding-bottom: 16px;
  }

  .sub-text {
    color: rgb(var(--gray-6));
    font-size: 12px;
    line-height: 18px;
  }
</style>
