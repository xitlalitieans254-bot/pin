import { METHODS, PARAM_TYPE } from "./methods";

const apis = {

    recommendList: {url: '/job/api/job/recommend/list', method: METHODS.GET}, //获取推荐职位列表
    nearbyList: {url: '/job/api/job/nearby/list', method: METHODS.GET}, //获取附近职位列表
    latestList: {url: '/job/api/job/latest/list', method: METHODS.GET}, //获取最新职位列表
    jobDetail: {url: '/job/api/job/', method: METHODS.GET, paramType: PARAM_TYPE.PATH}, //获取职位详情信息，jobId拼接在url之后


    /** 会员相关接口 */
    sendSmsCaptcha: {url: '/member/api/login/sms-captcha', method: METHODS.POST}, //发送登录短信
    smsLogin: {url: '/member/api/login/sms', method: METHODS.POST}, //短信登录接口

    memberInfo: {url: '/member/api/member/info', method: METHODS.GET}, //获取用户信息
    initBaseInfo: {url: '/member/api/member/init/base-info', method: METHODS.POST}, //初始化用户的基本信息

    /** 新用户引导相关接口 */
    onboardingStatus: {url: '/member/api/onboarding/status', method: METHODS.GET}, //获取当前引导状态
    onboardingRole: {url: '/member/api/onboarding/role', method: METHODS.POST}, //选择身份
    onboardingDraft: {url: '/member/api/onboarding/draft', method: METHODS.GET}, //获取引导草稿
    onboardingDraftSave: {url: '/member/api/onboarding/draft/save', method: METHODS.POST}, //保存引导草稿
    onboardingComplete: {url: '/member/api/onboarding/complete', method: METHODS.POST}, //完成引导
    onboardingOptions: {url: '/member/api/onboarding/options', method: METHODS.GET}, //获取引导选项

    /** 在线简历相关接口 */
    onlineResumeInfo: {url: '/member/api/online/resume/info', method: METHODS.POST}, // 获取用户的在线简历信息

    memberAttachmentResumeList: {url: '/member/api/member-attachment-resume/list', method: METHODS.GET}, // 获取附件简历列表
    memberAttachmentResumeSave: {url: '/member/api/member-attachment-resume/save', method: METHODS.POST}, // 保存用户附件简历
    memberAttachmentResumeDelete: {
        url: '/member/api/member-attachment-resume/delete/',
        method: METHODS.POST,
        paramType: PARAM_TYPE.PATH}, // 删除用户附件简历




    logout: {url: '/member/api/member/logout', method: METHODS.POST}, //登出接口

    /** 文件上传相关接口 */
    fileUpload: {url: '/file/api/file/upload', method: METHODS.POST}, //文件上传

    /** IM相关接口 */
    talkList: {url: '/im/talk/list', method: METHODS.GET}, //获取IM对话列表
    ensurePrivateTalk: {url: '/im/talk/private/ensure', method: METHODS.POST}, //确保私聊会话存在
    offlineMessageList: {url: '/im/message/offline/list', method: METHODS.POST}, //获取离线消息列表
    messageHistoryList: {url: '/im/message/history/list', method: METHODS.POST}, //获取IM历史消息列表

    /** 招聘方相关接口 */
    becomeBoss: {url: '/member/api/boss/member/become-boss', method: METHODS.GET}, //切换为招聘方身份
    submitToutouLicense: {url: '/member/api/member-toutou/submit', method: METHODS.POST}, //提交/更新营业执照
    myCompany: {url: '/job/api/company/my', method: METHODS.GET}, //获取我的企业资料
    saveMyCompany: {url: '/job/api/company/my/save', method: METHODS.POST}, //保存我的企业资料
    saveBossJob: {url: '/job/api/job/boss/save', method: METHODS.POST}, //发布/编辑职位
    bossJobList: {url: '/job/api/job/boss/list', method: METHODS.POST}, //我的职位列表
    bossJobStatus: {url: '/job/api/job/boss/status', method: METHODS.POST}, //上下架职位
    bossJobDelete: {url: '/job/api/job/boss/delete/', method: METHODS.POST, paramType: PARAM_TYPE.PATH}, //删除职位

    toutouWorkerList: {url: '/member/api/boss/member/list', method: METHODS.POST}, //获取打工人列表

}

export default apis;
