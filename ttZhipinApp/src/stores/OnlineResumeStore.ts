import ApiService from "../apis/ApiService";
import { observable } from "mobx";



export default class OnlineResumeStore {

    @observable onlineResumeInfo: Partial<ResumeData>  = {};
    
    //获取用户详细信息
    requestOnlineResumeInfo = async () => {
        try {
            const { data } = await ApiService.request('onlineResumeInfo', {});
            this.onlineResumeInfo = data.code === 0 && data.data ? data.data : {};
            return data;
        } catch (error) {
            console.log(error);
            this.onlineResumeInfo = {};
            return undefined;
        }
    }
    

}
