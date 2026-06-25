import axios from 'axios';
import query from 'query-string';

const BASE_URL = '/job/api/admin/company';

export interface OperationCompanyQuery {
  keyword?: string;
  status?: number;
  industry?: string;
  city?: string;
  page?: number;
  size?: number;
}

export interface OperationCompanyResponse {
  id?: number;
  applyMemberId?: number;
  companyFullName?: string;
  companyAbbrName?: string;
  companyLogo?: string;
  companyDescription?: string;
  companyScale?: string;
  financingStage?: string;
  industry?: string;
  workDateStart?: string;
  workDateEnd?: string;
  restWay?: number;
  overtime?: number;
  photo?: string;
  employeeWelfare?: string;
  mainBusiness?: string;
  longitude?: number;
  latitude?: number;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  addressDetail?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationCompanyPage {
  list: OperationCompanyResponse[];
  total: number;
}

export function pageOperationCompany(params: OperationCompanyQuery) {
  return axios.get<OperationCompanyPage>(`${BASE_URL}/page`, {
    params,
    paramsSerializer: (obj) => query.stringify(obj),
  });
}

export function getOperationCompany(id: number) {
  return axios.get<OperationCompanyResponse>(`${BASE_URL}/${id}`);
}

export function updateOperationCompanyStatus(id: number, status: number) {
  return axios.patch<boolean>(`${BASE_URL}/status/${id}`, null, {
    params: { status },
  });
}
