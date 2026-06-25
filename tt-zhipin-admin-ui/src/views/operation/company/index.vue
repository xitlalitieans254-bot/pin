<template>
  <div class="container">
    <Breadcrumb :items="['运营管理', '企业管理']" />
    <a-card class="general-card" title="企业管理">
      <div class="toolbar">
        <a-form :model="queryParams" layout="inline">
          <a-form-item hide-label>
            <a-input
              v-model="queryParams.keyword"
              placeholder="公司全称 / 简称"
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
            <a-input
              v-model="queryParams.industry"
              placeholder="行业"
              allow-clear
              style="width: 150px"
              @press-enter="handleQuery"
            />
          </a-form-item>
          <a-form-item hide-label>
            <a-input
              v-model="queryParams.city"
              placeholder="城市"
              allow-clear
              style="width: 130px"
              @press-enter="handleQuery"
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
        :data="companyList"
        :loading="loading"
        :bordered="false"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="100" />
          <a-table-column title="企业" :width="260">
            <template #cell="{ record }">
              <a-link @click="openDetail(record.id)">{{ emptyText(record.companyFullName) }}</a-link>
              <div class="sub-text">{{ emptyText(record.companyAbbrName) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="行业 / 规模" :width="190">
            <template #cell="{ record }">
              {{ emptyText(record.industry) }}
              <div class="sub-text">{{ emptyText(record.companyScale) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="城市" :width="150">
            <template #cell="{ record }">{{ compactLocation(record) }}</template>
          </a-table-column>
          <a-table-column title="作息" :width="150">
            <template #cell="{ record }">
              {{ restWayText(record.restWay) }}
              <div class="sub-text">{{ overtimeText(record.overtime) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="createdAt" :width="170" />
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
      title="企业详情"
      :visible="detailVisible"
      :width="760"
      :footer="false"
      unmount-on-close
      render-to-body
      @cancel="detailVisible = false"
    >
      <a-spin :loading="detailLoading" style="width: 100%">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="企业ID">{{ emptyText(companyDetail.id) }}</a-descriptions-item>
          <a-descriptions-item label="申请会员ID">{{ emptyText(companyDetail.applyMemberId) }}</a-descriptions-item>
          <a-descriptions-item label="公司全称">{{ emptyText(companyDetail.companyFullName) }}</a-descriptions-item>
          <a-descriptions-item label="公司简称">{{ emptyText(companyDetail.companyAbbrName) }}</a-descriptions-item>
          <a-descriptions-item label="行业">{{ emptyText(companyDetail.industry) }}</a-descriptions-item>
          <a-descriptions-item label="规模">{{ emptyText(companyDetail.companyScale) }}</a-descriptions-item>
          <a-descriptions-item label="融资阶段">{{ emptyText(companyDetail.financingStage) }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ statusText(companyDetail.status) }}</a-descriptions-item>
          <a-descriptions-item label="休息制度">{{ restWayText(companyDetail.restWay) }}</a-descriptions-item>
          <a-descriptions-item label="加班情况">{{ overtimeText(companyDetail.overtime) }}</a-descriptions-item>
          <a-descriptions-item label="地区">{{ compactLocation(companyDetail) }}</a-descriptions-item>
          <a-descriptions-item label="详细地址">{{ emptyText(companyDetail.addressDetail) }}</a-descriptions-item>
          <a-descriptions-item label="主营业务" :span="2">{{ formatJsonList(companyDetail.mainBusiness) }}</a-descriptions-item>
          <a-descriptions-item label="员工福利" :span="2">{{ formatJsonList(companyDetail.employeeWelfare) }}</a-descriptions-item>
          <a-descriptions-item label="公司照片" :span="2">{{ formatJsonList(companyDetail.photo) }}</a-descriptions-item>
          <a-descriptions-item label="公司介绍" :span="2">{{ emptyText(companyDetail.companyDescription) }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ emptyText(companyDetail.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ emptyText(companyDetail.updatedAt) }}</a-descriptions-item>
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
    getOperationCompany,
    OperationCompanyQuery,
    OperationCompanyResponse,
    pageOperationCompany,
    updateOperationCompanyStatus,
  } from '@/api/operation/company';

  const { loading, setLoading } = useLoading(false);
  const queryParams = reactive<OperationCompanyQuery>({
    page: 1,
    size: 10,
  });

  const statusOptions = [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ];

  const companyList = ref<OperationCompanyResponse[]>([]);
  const total = ref(0);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const companyDetail = ref<OperationCompanyResponse>({});

  const pagination = computed(() => ({
    showTotal: true,
    showPageSize: true,
    total: total.value,
    current: queryParams.page,
    pageSize: queryParams.size,
  }));

  const fetchData = () => {
    setLoading(true);
    pageOperationCompany({ ...queryParams })
      .then((res) => {
        companyList.value = res.data.list || [];
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
    queryParams.industry = undefined;
    queryParams.city = undefined;
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

  const handleStatusChange = (record: OperationCompanyResponse, status: number) => {
    if (!record.id) return;
    const previousStatus = status === 1 ? 0 : 1;
    updateOperationCompanyStatus(record.id, status)
      .then(() => {
        Message.success(status === 1 ? '企业已启用' : '企业已禁用');
      })
      .catch(() => {
        record.status = previousStatus;
      });
  };

  const openDetail = (id?: number) => {
    if (!id) return;
    detailVisible.value = true;
    detailLoading.value = true;
    getOperationCompany(id)
      .then((res) => {
        companyDetail.value = res.data || {};
      })
      .finally(() => {
        detailLoading.value = false;
      });
  };

  const emptyText = (value: unknown) => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const statusText = (status?: number) => (status === 1 ? '启用' : '禁用');
  const restWayText = (value?: number) => ({ 1: '双休', 2: '排班轮休' }[Number(value)] || '未设置');
  const overtimeText = (value?: number) =>
    ({ 1: '不加班', 2: '偶尔加班', 3: '弹性工作' }[Number(value)] || '未设置');

  const compactLocation = (record: OperationCompanyResponse) =>
    [record.province, record.city, record.district].filter(Boolean).join(' / ') || '-';

  const formatJsonList = (value?: string) => {
    if (!value) return '-';
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const text = parsed
          .map((item) => {
            if (typeof item === 'string') return item;
            return item.title || item.name || item.label || JSON.stringify(item);
          })
          .filter(Boolean)
          .join('、');
        return text || '-';
      }
    } catch (error) {
      return value;
    }
    return value;
  };

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
