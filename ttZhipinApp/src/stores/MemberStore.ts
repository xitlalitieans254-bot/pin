import ApiService from "../apis/ApiService";
import { flow } from "mobx";
import StorageUtil from "../utils/StorageUtil";
import { CommonConstant } from "../common/CommonConstant";
type InitInfoCallback = (success: boolean, message?: string) => void;
type SmsLoginCallback = (success: boolean, message?: string) => void;

const extractToken = (payload: any): string => {
    if (!payload) {
        return '';
    }

    if (typeof payload === 'string') {
        return payload;
    }

    return payload.token
        ?? payload.accessToken
        ?? payload.access_token
        ?? payload.loginToken
        ?? payload.data?.token
        ?? '';
};

const normalizeString = (value: any): string => {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number') {
        return String(value);
    }

    return '';
};

const extractLoginUuid = (payload: any): string => {
    if (!payload) {
        return '';
    }

    const directValue = normalizeString(payload);
    if (directValue) {
        return directValue;
    }

    return normalizeString(
        payload.uuid
        ?? payload.loginToken
        ?? payload.login_token
        ?? payload.token
        ?? payload.smsUuid
        ?? payload.sms_uuid
        ?? payload.captchaUuid
        ?? payload.captcha_uuid
        ?? payload.captchaKey
        ?? payload.captcha_key
        ?? payload.key
        ?? payload.data?.uuid
        ?? payload.data?.loginToken
        ?? payload.data?.login_token
        ?? payload.data?.token
        ?? payload.data?.smsUuid
        ?? payload.data?.sms_uuid
        ?? payload.data?.captchaUuid
        ?? payload.data?.captcha_uuid
        ?? payload.data?.captchaKey
        ?? payload.data?.captcha_key
        ?? payload.data?.key
    );
};

class MemberStore {

    token : any;

    loginToken: any;
    
    requestSmsLogin = flow(function* (this: MemberStore, phone: string, smsCode: string, uuid: string, callback: SmsLoginCallback) {
        try {
            const cachedUuid = yield StorageUtil.getItem(CommonConstant.LOGIN_TOKEN);
            const loginUuid = extractLoginUuid(uuid) || extractLoginUuid(cachedUuid);
            if (!loginUuid) {
                this.token = null;
                callback?.(false, '验证码登录凭证已失效，请重新发送验证码');
                return;
            }

            const params = {
                phone: phone,
                smsCode: smsCode,
                uuid: loginUuid
            };

            const { data } = yield ApiService.request('smsLogin', params);
            if (data) {
                if(data.code !== 0) {
                    this.token = null;
                    callback?.(false, data.message || '登录失败');
                    return;
                }

                const token = extractToken(data.data);
                if (!token) {
                    this.token = null;
                    callback?.(false, '未获取到登录凭证');
                    return;
                }

                this.token = token;
                yield StorageUtil.setItem(CommonConstant.TOKEN, token);
                try {
                    const memberInfoRes = yield ApiService.request('memberInfo');
                    if (memberInfoRes?.data?.code === 0 && memberInfoRes.data.data) {
                        yield StorageUtil.setItem(CommonConstant.MEMBER_INFO, JSON.stringify(memberInfoRes.data.data));
                    }
                } catch (error) {
                    console.log('cache member info failed', error);
                }
                callback?.(true);
            } else {
                this.token = null;
                callback?.(false, '服务器没有返回数据');
            }
        } catch (error) {
            this.token = null;
            callback?.(false, (error as any)?.message || '网络异常，请稍后重试');
        }
    });


    requestSendSmsCaptcha = flow(function* (this: MemberStore, phone: string, callback: (success: boolean, message?: string) => void) {
        try {
            yield StorageUtil.removeItem(CommonConstant.TOKEN);
            yield StorageUtil.removeItem(CommonConstant.LOGIN_TOKEN);

            const params = { phone: phone };
            
            const { data } = yield ApiService.request('sendSmsCaptcha', params);
            if (data) {
                if (data.code !== 0) {
                    this.loginToken = null;
                    callback?.(false, data.message || '验证码发送失败');
                    return;
                }
                const loginToken = extractLoginUuid(data.data ?? data);
                if (!loginToken) {
                    this.loginToken = null;
                    callback?.(false, '未获取到验证码登录凭证');
                    return;
                }
                this.loginToken = loginToken;
                yield StorageUtil.setItem(CommonConstant.LOGIN_TOKEN, loginToken);
                callback?.(true);
            } else {
                this.loginToken = null;
                callback?.(false, '服务器没有返回数据');
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.(false, (error as any)?.message || '网络异常，请稍后重试');
        }
    });


    requestMemberInfo = flow(function* (this: MemberStore, callback: (data?: MemberInfoEntity) => void) {
        try {
            
            const { data } = yield ApiService.request('memberInfo');
            if (data) {
                if(data.code === 0) {
                    yield StorageUtil.setItem(CommonConstant.MEMBER_INFO, JSON.stringify(data.data));
                    callback?.(data.data);
                }else {
                    callback?.(undefined);
                }
            }
        } catch (error) {
            console.log("memberInfo error", JSON.stringify({
                message: (error as any)?.message,
                status: (error as any)?.response?.status,
                data: (error as any)?.response?.data
            }));
            this.loginToken = null;
            callback?.(undefined);
        }
    });

    initBaseInfo = flow(function* (this: MemberStore, name: string, gender: number, birthday: string, callback: InitInfoCallback) {
        try {
            const params = {
                fullName: name,
                gender: gender,
                birthday: birthday
            };
            const { data } = yield ApiService.request('initBaseInfo', params);
            if (data?.code === 0) {
                callback?.(true);
            } else {
                callback?.(false, data?.message || '基本信息保存失败');
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.(false, '网络异常，请稍后重试');
        }
    });

    initIdentityInfo = flow(function* (this: MemberStore, selectedButtonIdentityStatus: number, workStatus: number, callback: InitInfoCallback) {
        try {
            const params = {
                identityStatus: selectedButtonIdentityStatus,
                workStatus: workStatus
            };
            

            const { data } = yield ApiService.request('initBaseInfo', params);
            if (data?.code === 0) {
                callback?.(true);
            } else {
                callback?.(false, data?.message || '求职状态保存失败');
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.(false, '网络异常，请稍后重试');
        }
    });


    initQualificationInfo = flow(function* (this: MemberStore, highestQualification: number, highestQualificationType: number, callback: InitInfoCallback) {
        try {
            const params = {
                highestQualification: highestQualification,
                highestQualificationType: highestQualificationType
            };
            const { data } = yield ApiService.request('initBaseInfo', params);
            if (data?.code === 0) {
                callback?.(true);
            } else {
                callback?.(false, data?.message || '学历信息保存失败');
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.(false, '网络异常，请稍后重试');
        }
    });


    initAvatar = flow(function* (this: MemberStore, avatar: string, callback: InitInfoCallback) {
        try {
            const params = {
                avatar: avatar
            };
            const { data } = yield ApiService.request('initBaseInfo', params);
            if (data?.code === 0) {
                callback?.(true);
            } else {
                callback?.(false, data?.message || '头像保存失败');
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.(false, '网络异常，请稍后重试');
        }
    });


    uploadAvatar = flow(function* (this: MemberStore, url: string, uri: string, fileName: string, fileType: string, callback: (url: string) => void) {
        try {
            const { data } = yield ApiService.upload(url, uri, fileName, fileType);
            if (data) {
                if(data.code === 0) {
                    callback?.(data.data);
                }
            }
        } catch (error) {
            console.log(error);
            this.loginToken = null;
            callback?.('');
        }
    });
}

export default new MemberStore();
