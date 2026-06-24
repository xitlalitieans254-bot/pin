import { action, observable } from "mobx";
import ApiService from "../apis/ApiService";

const PAGE_SIZE = 10;

export default class BossStore {
    page: number = 1;

    //@ts-ignore
    @observable jobList: JobEntity[] = [];

    //@ts-ignore
    @observable companyInfo: any = {};

    //@ts-ignore
    @observable refreshing: boolean = false;

    //@ts-ignore
    @observable hasMore: boolean = true;

    //@ts-ignore
    @observable errorMessage: string = '';

    //@ts-ignore
    @action
    resetJobList = () => {
        this.page = 1;
        this.hasMore = true;
    }

    becomeBoss = async () => {
        const { data } = await ApiService.request('becomeBoss');
        return data;
    }

    submitToutouLicense = async (businessLicense: string) => {
        const { data } = await ApiService.request('submitToutouLicense', { businessLicense });
        return data;
    }

    requestMyCompany = async () => {
        const { data } = await ApiService.request('myCompany');
        if (data?.code === 0) {
            this.companyInfo = data.data || {};
        }
        return data;
    }

    saveMyCompany = async (params: any) => {
        const { data } = await ApiService.request('saveMyCompany', params);
        if (data?.code === 0) {
            this.companyInfo = data.data || params || {};
        }
        return data;
    }

    saveBossJob = async (params: any) => {
        const normalizedParams = {
            ...params,
            id: params?.id ? String(params.id) : undefined,
            companyId: params?.companyId ? String(params.companyId) : undefined,
        };
        const { data } = await ApiService.request('saveBossJob', normalizedParams);
        return data;
    }

    requestBossJobList = async (reset: boolean = false) => {
        if (this.refreshing) {
            return;
        }

        if (reset) {
            this.resetJobList();
        }

        if (!this.hasMore && !reset) {
            return;
        }

        try {
            this.refreshing = true;
            this.errorMessage = '';

            const { data } = await ApiService.request('bossJobList', {
                page: this.page,
                size: PAGE_SIZE,
            });

            if (data?.code !== 0) {
                this.errorMessage = data?.message || '职位列表加载失败';
                if (this.page === 1) {
                    this.jobList = [];
                }
                return;
            }

            const pageData = data.data || {};
            const list = Array.isArray(pageData.list) ? pageData.list : [];
            const total = Number(pageData.total || 0);

            if (this.page === 1) {
                this.jobList = list;
            } else if (list.length > 0) {
                this.jobList = [...this.jobList, ...list];
            }

            if (list.length > 0) {
                this.page = this.page + 1;
            }

            this.hasMore = this.jobList.length < total && list.length > 0;
        } catch (error: any) {
            this.errorMessage = error?.response?.data?.message || error?.message || '职位列表加载失败';
            if (this.page === 1) {
                this.jobList = [];
            }
        } finally {
            this.refreshing = false;
        }
    }

    changeBossJobStatus = async (jobId: SnowflakeIdInput, status: number) => {
        const { data } = await ApiService.request('bossJobStatus', {
            jobId: String(jobId),
            status,
        });
        return data;
    }

    deleteBossJob = async (jobId: SnowflakeIdInput) => {
        const { data } = await ApiService.request('bossJobDelete', String(jobId));
        return data;
    }
}
