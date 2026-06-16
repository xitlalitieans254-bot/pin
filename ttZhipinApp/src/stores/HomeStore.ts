import { action, flow, observable } from "mobx";
import ApiService from "../apis/ApiService";

const SIZE = 10;
type JobListType = 'recommend' | 'nearby' | 'latest';

const JOB_LIST_API: Record<JobListType, string> = {
    recommend: 'recommendList',
    nearby: 'nearbyList',
    latest: 'latestList',
};

const parseJsonObject = (value?: any) => {
    if (!value) {
        return {};
    }

    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

export default class HomeStore {

    page: number = 1;

    //@ts-ignore
    @observable currentListType: JobListType = 'recommend';

    //@ts-ignore
    @observable hasMore: boolean = true;

    //@ts-ignore
    @observable index: number = 0;

    //@ts-ignore
    @observable jobList: JobEntity[] = [];

    //@ts-ignore
    @observable refreshing: boolean = false;

    //@ts-ignore
    @observable errorMessage: string = '';

    //@ts-ignore
    @action
    resetPage = () => {
        this.page = 1;
        this.hasMore = true;
    }

    requestJobList = async (listType: JobListType = this.currentListType, reset: boolean = false) => {
        if(this.refreshing) {
            return;
        }

        if(reset || this.currentListType !== listType) {
            this.currentListType = listType;
            this.page = 1;
            this.hasMore = true;
        }

        if(!this.hasMore && !reset) {
            return;
        }

        try{
            this.refreshing = true;
            this.errorMessage = '';

            const params = {
                page: this.page,
                size: SIZE,
            };

            const { data } = await ApiService.request(JOB_LIST_API[listType], params);
            const pageData = data?.data;
            const list = Array.isArray(pageData?.list) ? pageData.list : [];
            const total = Number(pageData?.total || 0);

            if(this.page === 1) {
                this.jobList = list;
            }else if(list.length > 0) {
                this.jobList = [...this.jobList, ...list];
            }

            if(list.length > 0) {
                this.page = this.page + 1;
            }

            this.hasMore = this.jobList.length < total && list.length > 0;
        }catch(error) {
            this.errorMessage = '职位加载失败';
            if(this.page === 1) {
                this.jobList = [];
            }
        }finally{
            this.refreshing = false;
        }

    }

    requestLatestTest = async () => {
        return this.requestJobList('recommend');
    }
    requestDetail = async (id:string) => {

        if(this.detailRefreshing) {
            return;
        }

        try{
            this.detailRefreshing = true;

            const { data } = await ApiService.request('jobDetail', id);

            if(data?.code === 0 && data.data) {
                this.jobDetail = data.data;
                this.memberInfo = parseJsonObject(this.jobDetail.memberInfo);
            }else {
                this.jobDetail = {};
                this.memberInfo = {};
            }
        }catch(error) {

        }finally{
            this.detailRefreshing = false;
        }

        
    }

    //@ts-ignore
    @observable jobDetail: JobEntity = {};

    //@ts-ignore
    @observable memberInfo: any = {};

    //@ts-ignore
    @observable detailRefreshing: boolean = false;


    requestDetail2 = flow(function* (this: HomeStore, id: string, callback: (data?: JobEntity) => void) {
        try {

            const { data } = yield ApiService.request('jobDetail', id);
            if (data?.code === 0 && data.data) {
                this.jobDetail = data.data;
                this.memberInfo = parseJsonObject(data.data.memberInfo);
                callback?.(data.data);
            } else {
                this.jobDetail = {};
                this.memberInfo = {};
                callback?.(undefined);
            }
        } catch (error) {
            callback?.(undefined);
        }
    });
}
