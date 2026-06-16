export type InitMemberInfoStep =
    | 'renderInitNameInfo'
    | 'renderInitStatusInfo'
    | 'renderInitQualification'
    | 'renderInitAvatar';

export const isEmptyMemberInfoValue = (value: unknown): boolean => {
    if (value === undefined || value === null) {
        return true;
    }

    if (typeof value === 'number') {
        return Number.isNaN(value) || value <= 0;
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim();
        return normalizedValue === ''
            || normalizedValue === '0'
            || normalizedValue === 'null'
            || normalizedValue === 'undefined';
    }

    return false;
};

export const getMissingMemberInfoStep = (memberInfo?: Partial<MemberInfoEntity>): InitMemberInfoStep | undefined => {
    const info = memberInfo || {};

    if (
        isEmptyMemberInfoValue(info.fullName)
        || isEmptyMemberInfoValue(info.gender)
        || isEmptyMemberInfoValue(info.birthday)
    ) {
        return 'renderInitNameInfo';
    }

    if (
        isEmptyMemberInfoValue(info.identityStatus)
        || isEmptyMemberInfoValue(info.workStatus)
    ) {
        return 'renderInitStatusInfo';
    }

    if (
        isEmptyMemberInfoValue(info.highestQualification)
        || isEmptyMemberInfoValue(info.highestQualificationType)
    ) {
        return 'renderInitQualification';
    }

    if (isEmptyMemberInfoValue(info.avatar)) {
        return 'renderInitAvatar';
    }

    return undefined;
};

export const isMemberInfoComplete = (memberInfo?: Partial<MemberInfoEntity>): boolean => {
    return getMissingMemberInfoStep(memberInfo) === undefined;
};
