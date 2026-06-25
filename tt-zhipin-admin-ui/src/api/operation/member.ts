import axios from 'axios';
import query from 'query-string';

const BASE_URL = '/member/api/admin/member';

export interface OperationMemberQuery {
  keyword?: string;
  status?: number;
  identityStatus?: number;
  isToutou?: number;
  page?: number;
  size?: number;
}

export interface OperationMemberResponse {
  id?: number;
  phone?: string;
  email?: string;
  fullName?: string;
  workDate?: string;
  wxCode?: string;
  birthday?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  gender?: number;
  avatar?: string;
  ip?: string;
  loginCount?: number;
  loginErrorCount?: number;
  lastLogin?: string;
  identityStatus?: number;
  workStatus?: number;
  highestQualification?: number;
  highestQualificationType?: number;
  isToutou?: number;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationMemberPage {
  list: OperationMemberResponse[];
  total: number;
}

export function pageOperationMember(params: OperationMemberQuery) {
  return axios.get<OperationMemberPage>(`${BASE_URL}/page`, {
    params,
    paramsSerializer: (obj) => query.stringify(obj),
  });
}

export function getOperationMember(id: number) {
  return axios.get<OperationMemberResponse>(`${BASE_URL}/${id}`);
}

export function updateOperationMemberStatus(id: number, status: number) {
  return axios.patch<boolean>(`${BASE_URL}/status/${id}`, null, {
    params: { status },
  });
}
