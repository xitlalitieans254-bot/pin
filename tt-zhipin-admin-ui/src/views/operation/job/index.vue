<template>
  <div class="container">
    <Breadcrumb :items="['运营管理', '职位管理']" />
    <a-card class="general-card" title="职位管理">
      <div class="toolbar">
        <a-form :model="queryParams" layout="inline">
          <a-form-item hide-label>
            <a-input
              v-model="queryParams.keyword"
              placeholder="职位 / 描述 / 城市 / 地址"
              allow-clear
              style="width: 240px"
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
            <a-input-number
              v-model="queryParams.companyId"
              placeholder="企业ID"
              hide-button
              allow-clear
              style="width: 140px"
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
        :data="jobList"
        :loading="loading"
        :bordered="false"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="100" />
          <a-table-column title="职位" :width="240">
            <template #cell="{ record }">
              <a-link @click="openDetail(record.id)">{{ emptyText(record.jobName) }}</a-link>
              <div class="sub-text">{{ salaryText(record) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="企业" :width="220">
            <template #cell="{ record }">
              {{ emptyText(record.companyAbbrName || record.companyFullName) }}
              <div class="sub-text">ID: {{ emptyText(record.companyId) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="要求" :width="170">
            <template #cell="{ record }">
              {{ workYearText(record) }}
              <div class="sub-text">{{ emptyText(record.educationAttainment) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="城市 / 地址" :width="220">
            <template #cell="{ record }">
              {{ compactLocation(record) }}
              <div class="sub-text">{{ emptyText(record.addressDetail) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="回复数" data-index="replyCount" :width="90" />
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
      title="职位详情"
      :visible="detailVisible"
      :width="760"
      :footer="false"
      unmount-on-close
      render-to-body
      @cancel="detailVisible = false"
    >
      <a-spin :loading="detailLoading" style="width: 100%">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="职位ID">{{ emptyText(jobDetail.id) }}</a-descriptions-item>
          <a-descriptions-item label="发布人ID">{{ emptyText(jobDetail.memberId) }}</a-descriptions-item>
          <a-descriptions-item label="职位名称">{{ emptyText(jobDetail.jobName) }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ statusText(jobDetail.status) }}</a-descriptions-item>
          <a-descriptions-item label="企业ID">{{ emptyText(jobDetail.companyId) }}</a-descriptions-item>
          <a-descriptions-item label="企业名称">{{ emptyText(jobDetail.companyFullName || jobDetail.companyAbbrName) }}</a-descriptions-item>
          <a-descriptions-item label="薪资范围">{{ salaryText(jobDetail) }}</a-descriptions-item>
          <a-descriptions-item label="工作经验">{{ workYearText(jobDetail) }}</a-descriptions-item>
          <a-descriptions-item label="学历要求">{{ emptyText(jobDetail.educationAttainment) }}</a-descriptions-item>
          <a-descriptions-item label="年龄范围">{{ ageText(jobDetail) }}</a-descriptions-item>
          <a-descriptions-item label="地区">{{ compactLocation(jobDetail) }}</a-descriptions-item>
          <a-descriptions-item label="详细地址">{{ emptyText(jobDetail.addressDetail) }}</a-descriptions-item>
          <a-descriptions-item label="职位标签" :span="2">{{ emptyText(jobDetail.jobTags) }}</a-descriptions-item>
          <a-descriptions-item label="薪资补充" :span="2">{{ emptyText(jobDetail.salaryOptional) }}</a-descriptions-item>
          <a-descriptions-item label="职位描述" :span="2">{{ emptyText(jobDetail.jobDescription) }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ emptyText(jobDetail.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ emptyText(jobDetail.updatedAt) }}</a-descriptions-item>
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
    getOperationJob,
    OperationJobQuery,
    OperationJobResponse,
    pageOperationJob,
    updateOperationJobStatus,
  } from '@/api/operation/job';

  const { loading, setLoading } = useLoading(false);
  const queryParams = reactive<OperationJobQuery>({
    page: 1,
    size: 10,
  });

  const statusOptions = [
    { label: '上架', value: 1 },
    { label: '下架', value: 0 },
  ];

  const jobList = ref<OperationJobResponse[]>([]);
  const total = ref(0);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const jobDetail = ref<OperationJobResponse>({});

  const pagination = computed(() => ({
    showTotal: true,
    showPageSize: true,
    total: total.value,
    current: queryParams.page,
    pageSize: queryParams.size,
  }));

  const fetchData = () => {
    setLoading(true);
    pageOperationJob({ ...queryParams })
      .then((res) => {
        jobList.value = res.data.list || [];
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
    queryParams.companyId = undefined;
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

  const handleStatusChange = (record: OperationJobResponse, status: number) => {
    if (!record.id) return;
    const previousStatus = status === 1 ? 0 : 1;
    updateOperationJobStatus(record.id, status)
      .then(() => {
        Message.success(status === 1 ? '职位已上架' : '职位已下架');
      })
      .catch(() => {
        record.status = previousStatus;
      });
  };

  const openDetail = (id?: number) => {
    if (!id) return;
    detailVisible.value = true;
    detailLoading.value = true;
    getOperationJob(id)
      .then((res) => {
        jobDetail.value = res.data || {};
      })
      .finally(() => {
        detailLoading.value = false;
      });
  };

  const emptyText = (value: unknown) => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const statusText = (status?: number) => (status === 1 ? '上架' : '下架');

  const salaryText = (record: OperationJobResponse) => {
    if (!record.salaryRangeStart && !record.salaryRangeEnd) return '-';
    return `${record.salaryRangeStart || 0}K-${record.salaryRangeEnd || 0}K`;
  };

  const workYearText = (record: OperationJobResponse) => {
    if (!record.workYearRangeStart && !record.workYearRangeEnd) return '经验不限';
    return `${record.workYearRangeStart || 0}-${record.workYearRangeEnd || 0}年`;
  };

  const ageText = (record: OperationJobResponse) => {
    if (!record.ageRangeStart && !record.ageRangeEnd) return '-';
    return `${record.ageRangeStart || 0}-${record.ageRangeEnd || 0}岁`;
  };

  const compactLocation = (record: OperationJobResponse) =>
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
