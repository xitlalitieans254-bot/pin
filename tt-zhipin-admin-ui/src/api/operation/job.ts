import axios from 'axios';
import query from 'query-string';

const BASE_URL = '/job/api/admin/job';

export interface OperationJobQuery {
  keyword?: string;
  status?: number;
  companyId?: number;
  city?: string;
  page?: number;
  size?: number;
}

export interface OperationJobResponse {
  id?: number;
  memberId?: number;
  memberInfo?: string;
  companyId?: number;
  companyFullName?: string;
  companyAbbrName?: string;
  jobName?: string;
  salaryRangeStart?: number;
  salaryRangeEnd?: number;
  salaryOptional?: string;
  workYearRangeStart?: number;
  workYearRangeEnd?: number;
  ageRangeStart?: number;
  ageRangeEnd?: number;
  educationAttainment?: string;
  jobTags?: string;
  jobDescription?: string;
  replyCount?: number;
  longitude?: number;
  latitude?: number;
  locationImg?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  addressDetail?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationJobPage {
  list: OperationJobResponse[];
  total: number;
}

export function pageOperationJob(params: OperationJobQuery) {
  return axios.get<OperationJobPage>(`${BASE_URL}/page`, {
    params,
    paramsSerializer: (obj) => query.stringify(obj),
  });
}

export function getOperationJob(id: number) {
  return axios.get<OperationJobResponse>(`${BASE_URL}/${id}`);
}

export function updateOperationJobStatus(id: number, status: number) {
  return axios.patch<boolean>(`${BASE_URL}/status/${id}`, null, {
    params: { status },
  });
}
