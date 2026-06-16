import { CommonConstant } from "../common/CommonConstant";
import StorageUtil from "./StorageUtil";

export type OnlineResumeSection =
    | 'advantage'
    | 'workExpect'
    | 'workExperience'
    | 'projectExperience'
    | 'eduExperience';

export const ONLINE_RESUME_SECTION_TITLES: Record<OnlineResumeSection, string> = {
    advantage: '个人优势',
    workExpect: '求职期望',
    workExperience: '工作经历',
    projectExperience: '项目经历',
    eduExperience: '教育经历',
};

const getDraftKey = async (): Promise<string> => {
    const memberInfoText = await StorageUtil.getItem(CommonConstant.MEMBER_INFO);
    let memberKey = 'default';

    if (memberInfoText) {
        try {
            const memberInfo = JSON.parse(memberInfoText);
            memberKey = memberInfo?.id || memberInfo?.phone || memberKey;
        } catch (error) {
            memberKey = memberInfoText;
        }
    }

    return `online_resume_draft_${memberKey}`;
};

export const getEmptyResumeDraft = (): Partial<ResumeData> => ({
    advantage: '',
    workExpectDtoList: [],
    workExperienceDtoList: [],
    projectExperienceDtoList: [],
    eduExperienceDtoList: [],
});

export const normalizeResumeData = (resume?: Partial<ResumeData>): Partial<ResumeData> => ({
    ...(resume || {}),
    advantage: resume?.advantage || '',
    workExpectDtoList: resume?.workExpectDtoList || [],
    workExperienceDtoList: resume?.workExperienceDtoList || [],
    projectExperienceDtoList: resume?.projectExperienceDtoList || [],
    eduExperienceDtoList: resume?.eduExperienceDtoList || [],
});

export const loadOnlineResumeDraft = async (): Promise<Partial<ResumeData>> => {
    const key = await getDraftKey();
    const draft = await StorageUtil.getJsonItem(key);
    return normalizeResumeData(draft || getEmptyResumeDraft());
};

export const saveOnlineResumeDraft = async (resume: Partial<ResumeData>): Promise<void> => {
    const key = await getDraftKey();
    await StorageUtil.setJsonItem(key, normalizeResumeData(resume));
};

export const mergeResumeWithDraft = (
    remoteResume?: Partial<ResumeData>,
    localDraft?: Partial<ResumeData>
): Partial<ResumeData> => {
    const normalizedRemote = normalizeResumeData(remoteResume || {});
    const normalizedDraft = normalizeResumeData(localDraft || {});

    return {
        ...normalizedRemote,
        advantage: normalizedDraft.advantage || normalizedRemote.advantage || '',
        workExpectDtoList: normalizedDraft.workExpectDtoList?.length
            ? normalizedDraft.workExpectDtoList
            : normalizedRemote.workExpectDtoList || [],
        workExperienceDtoList: normalizedDraft.workExperienceDtoList?.length
            ? normalizedDraft.workExperienceDtoList
            : normalizedRemote.workExperienceDtoList || [],
        projectExperienceDtoList: normalizedDraft.projectExperienceDtoList?.length
            ? normalizedDraft.projectExperienceDtoList
            : normalizedRemote.projectExperienceDtoList || [],
        eduExperienceDtoList: normalizedDraft.eduExperienceDtoList?.length
            ? normalizedDraft.eduExperienceDtoList
            : normalizedRemote.eduExperienceDtoList || [],
        memberInfoResponse: normalizedRemote.memberInfoResponse || normalizedDraft.memberInfoResponse,
        qualificationList: normalizedDraft.qualificationList || normalizedRemote.qualificationList || [],
    };
};

export const updateOnlineResumeSection = async (
    baseResume: Partial<ResumeData>,
    section: OnlineResumeSection,
    value: any,
    index?: number
): Promise<Partial<ResumeData>> => {
    const nextResume = normalizeResumeData(baseResume);

    if (section === 'advantage') {
        nextResume.advantage = value;
    }

    if (section === 'workExpect') {
        const list = [...(nextResume.workExpectDtoList || [])];
        if (typeof index === 'number' && index >= 0) {
            list[index] = value;
        } else {
            list.push(value);
        }
        nextResume.workExpectDtoList = list;
    }

    if (section === 'workExperience') {
        const list = [...(nextResume.workExperienceDtoList || [])];
        if (typeof index === 'number' && index >= 0) {
            list[index] = value;
        } else {
            list.push(value);
        }
        nextResume.workExperienceDtoList = list;
    }

    if (section === 'projectExperience') {
        const list = [...(nextResume.projectExperienceDtoList || [])];
        if (typeof index === 'number' && index >= 0) {
            list[index] = value;
        } else {
            list.push(value);
        }
        nextResume.projectExperienceDtoList = list;
    }

    if (section === 'eduExperience') {
        const list = [...(nextResume.eduExperienceDtoList || [])];
        if (typeof index === 'number' && index >= 0) {
            list[index] = value;
        } else {
            list.push(value);
        }
        nextResume.eduExperienceDtoList = list;
    }

    await saveOnlineResumeDraft(nextResume);
    return nextResume;
};

export const deleteOnlineResumeSectionItem = async (
    baseResume: Partial<ResumeData>,
    section: OnlineResumeSection,
    index: number
): Promise<Partial<ResumeData>> => {
    const nextResume = normalizeResumeData(baseResume);

    if (section === 'workExpect') {
        nextResume.workExpectDtoList = (nextResume.workExpectDtoList || []).filter((_, itemIndex) => itemIndex !== index);
    }

    if (section === 'workExperience') {
        nextResume.workExperienceDtoList = (nextResume.workExperienceDtoList || []).filter((_, itemIndex) => itemIndex !== index);
    }

    if (section === 'projectExperience') {
        nextResume.projectExperienceDtoList = (nextResume.projectExperienceDtoList || []).filter((_, itemIndex) => itemIndex !== index);
    }

    if (section === 'eduExperience') {
        nextResume.eduExperienceDtoList = (nextResume.eduExperienceDtoList || []).filter((_, itemIndex) => itemIndex !== index);
    }

    await saveOnlineResumeDraft(nextResume);
    return nextResume;
};
