import React, { useCallback, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { observer, useLocalStore } from 'mobx-react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import OnlineResumeStore from '../../../stores/OnlineResumeStore';
import { CommonColor } from '../../../common/CommonColor';
import { CommonConstant } from '../../../common/CommonConstant';
import { getChineseEducation, getEducationType, getJobStatus } from '../../../common/NormalEnum';
import DateUtil from '../../../utils/DateUtil';
import StorageUtil from '../../../utils/StorageUtil';
import {
  loadOnlineResumeDraft,
  mergeResumeWithDraft,
  OnlineResumeSection,
} from '../../../utils/OnlineResumeDraftUtil';

const ACCENT_COLOR = CommonColor.mainColor;
const ACCENT_BG = CommonColor.transparentMainColor;
const PAGE_BG = '#F6F7F9';
const CARD_BG = '#FFFFFF';

type ResumeSectionState = {
  id: 'basic' | OnlineResumeSection;
  title: string;
  completed: boolean;
};

const calculateAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) {
    return '';
  }

  const normalizedDate = dateOfBirth.includes(' ') ? dateOfBirth.replace(' ', 'T') : dateOfBirth;
  const birthDate = new Date(normalizedDate);
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }

  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  const dayDiff = currentDate.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age > 0 ? `${age}岁` : '';
};

const hasResumeContent = (resume: Partial<ResumeData>) => {
  return Boolean(
    resume.memberInfoResponse
    || resume.advantage
    || resume.workExpectDtoList?.length
    || resume.workExperienceDtoList?.length
    || resume.projectExperienceDtoList?.length
    || resume.eduExperienceDtoList?.length
  );
};

const compactText = (parts: Array<string | number | undefined | null>) => {
  return parts
    .map(item => (item === undefined || item === null ? '' : String(item).trim()))
    .filter(Boolean)
    .join(' · ');
};

const formatSalary = (item: Partial<WorkExpectDto>) => {
  if (!item.salaryRangeStart && !item.salaryRangeEnd) {
    return '';
  }

  if (item.salaryRangeStart && item.salaryRangeEnd) {
    return `${item.salaryRangeStart}K-${item.salaryRangeEnd}K`;
  }

  return item.salaryRangeStart ? `${item.salaryRangeStart}K起` : `${item.salaryRangeEnd}K以内`;
};

const formatDateRange = (start?: string, end?: string) => {
  const startText = DateUtil.formatWorkDate(start || '') || start || '';
  const endText = DateUtil.formatWorkDate(end || '') || end || '';
  return compactText([startText, endText]).replace(' · ', ' - ');
};

const getResumeSections = (
  resume: Partial<ResumeData>,
  memberInfo: Partial<MemberInfoResponse>,
): ResumeSectionState[] => {
  const basicCompleted = Boolean(
    memberInfo.fullName
    && memberInfo.birthday
    && memberInfo.workStatus
    && memberInfo.highestQualification
    && memberInfo.highestQualificationType
  );

  return [
    { id: 'basic', title: '个人信息', completed: basicCompleted },
    { id: 'advantage', title: '个人优势', completed: Boolean(resume.advantage?.trim()) },
    { id: 'workExpect', title: '求职期望', completed: Boolean(resume.workExpectDtoList?.length) },
    { id: 'workExperience', title: '工作经历', completed: Boolean(resume.workExperienceDtoList?.length) },
    { id: 'projectExperience', title: '项目经历', completed: Boolean(resume.projectExperienceDtoList?.length) },
    { id: 'eduExperience', title: '教育经历', completed: Boolean(resume.eduExperienceDtoList?.length) },
  ];
};

export default observer(() => {
  const store = useLocalStore(() => new OnlineResumeStore());
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  const resume = store.onlineResumeInfo || {};
  const memberInfo = (resume.memberInfoResponse || {}) as Partial<MemberInfoResponse>;
  const workExpectList = resume.workExpectDtoList || [];
  const workExperienceList = resume.workExperienceDtoList || [];
  const projectExperienceList = resume.projectExperienceDtoList || [];
  const eduExperienceList = resume.eduExperienceDtoList || [];
  const sections = getResumeSections(resume, memberInfo);
  const completedCount = sections.filter(item => item.completed).length;
  const pendingCount = sections.length - completedCount;
  const resumeScore = Math.round((completedCount / sections.length) * 100);

  const navigateToEdit = (section: OnlineResumeSection, item?: any, index?: number) => {
    navigation.push('OnlineResumeEditPage', {
      section,
      item,
      index,
      resume: store.onlineResumeInfo,
    });
  };

  const showPreviewNotice = () => {
    Alert.alert('预览暂未接入', '当前页面已经展示本机草稿内容。后端保存/预览接口完成后，可以切换为正式简历预览。');
  };

  const navigateToFirstIncomplete = () => {
    const firstMissing = sections.find(item => !item.completed);
    if (!firstMissing) {
      showPreviewNotice();
      return;
    }

    if (firstMissing.id === 'basic') {
      navigation.push('InitMemberInfoPage', { memberInfo });
      return;
    }

    navigateToEdit(firstMissing.id);
  };

  const loadResume = useCallback(async () => {
    setLoading(true);

    const [res, draft, cachedMemberInfoText] = await Promise.all([
      store.requestOnlineResumeInfo(),
      loadOnlineResumeDraft(),
      StorageUtil.getItem(CommonConstant.MEMBER_INFO),
    ]);

    let remoteResume = res?.code === 0 && res?.data ? res.data : {};
    if (cachedMemberInfoText) {
      try {
        const cachedMemberInfo = JSON.parse(cachedMemberInfoText);
        if (!remoteResume.memberInfoResponse && cachedMemberInfo) {
          remoteResume = {
            ...remoteResume,
            memberInfoResponse: cachedMemberInfo,
          };
        }
      } catch (error) {
        // 本地缓存异常时忽略，避免影响在线简历页面展示。
      }
    }

    const mergedResume = mergeResumeWithDraft(remoteResume, draft);
    store.onlineResumeInfo = mergedResume;
    setDataLoaded(hasResumeContent(mergedResume));
    setErrorMessage(res?.message || '暂无在线简历');
    setLoading(false);
  }, [store]);

  useEffect(() => {
    loadResume();
    const unsubscribe = navigation.addListener('focus', loadResume);
    return unsubscribe;
  }, [loadResume, navigation]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.headerButton}>
        <Ionicons name="chevron-back" size={24} color={CommonColor.fontColor} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>我的在线简历</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={showPreviewNotice} style={styles.headerRight}>
        <Text style={styles.headerRightText}>预览</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScoreCard = () => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreIcon}>
        <Ionicons name="sparkles-outline" size={24} color={ACCENT_COLOR} />
      </View>
      <View style={styles.scoreContent}>
        <Text style={styles.scoreTitle}>
          简历专业评分
          <Text style={styles.scoreNumber}> {resumeScore}</Text>
          <Text style={styles.scoreUnit}> 分</Text>
        </Text>
        <Text style={styles.scoreSubtitle}>招聘方会认真阅读你的简历，建议持续优化</Text>
      </View>
      <TouchableOpacity activeOpacity={0.85} onPress={navigateToFirstIncomplete} style={styles.scoreButton}>
        <Text style={styles.scoreButtonText}>{pendingCount > 0 ? '去完善' : '预览'}</Text>
      </TouchableOpacity>
      <View style={styles.scoreFooter}>
        <Text style={styles.pendingText}>{pendingCount}</Text>
        <Text style={styles.pendingLabel}> 个待优化项</Text>
        <View style={styles.footerDivider} />
        <Text style={styles.draftText}>已启用本机草稿</Text>
      </View>
    </View>
  );

  const renderProfileCard = () => {
    const age = calculateAge(memberInfo.birthday);
    const qualification = memberInfo.highestQualification ? getChineseEducation(memberInfo.highestQualification) : '';
    const qualificationType = memberInfo.highestQualificationType ? getEducationType(memberInfo.highestQualificationType) : '';
    const workStatus = memberInfo.workStatus ? getJobStatus(memberInfo.workStatus) : '未填写求职状态';
    const profileMeta = compactText([age, qualification, qualificationType]);
    const contactMeta = compactText([memberInfo.phone, memberInfo.wxCode ? `微信 ${memberInfo.wxCode}` : '']);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => navigation.push('InitMemberInfoPage', { memberInfo })}
        style={styles.profileCard}
      >
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{memberInfo.fullName || '未填写姓名'}</Text>
            <AntDesign name="form" size={14} color={CommonColor.normalGrey} style={styles.nameIcon} />
          </View>
          <Text style={styles.profileMeta}>{profileMeta || '年龄、学历待完善'}</Text>
          <Text style={styles.profileStatus}>{workStatus}</Text>
          <Text style={styles.profileContact} numberOfLines={1}>{contactMeta || '手机号、微信待完善'}</Text>
        </View>
        <Image
          style={styles.avatar}
          source={memberInfo.avatar ? { uri: memberInfo.avatar } : require('../../../assets/images/logo_bg_transparent.png')}
        />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (
    title: string,
    completed: boolean,
    onAdd?: () => void,
    addText = '添加',
  ) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.statusPill, completed ? styles.statusDone : styles.statusTodo]}>
          <Text style={[styles.statusText, completed ? styles.statusDoneText : styles.statusTodoText]}>
            {completed ? '已完成' : '待完善'}
          </Text>
        </View>
      </View>
      {onAdd ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onAdd} style={styles.addButton}>
          <Ionicons name="add" size={18} color={ACCENT_COLOR} />
          <Text style={styles.addButtonText}>{addText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderEmptyHint = (text: string, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} style={styles.emptyHint}>
      <Ionicons name="add-circle-outline" size={20} color={ACCENT_COLOR} />
      <Text style={styles.emptyHintText}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={CommonColor.normalGrey} />
    </TouchableOpacity>
  );

  const renderAdvantage = () => (
    <View style={styles.sectionCard}>
      {renderSectionHeader('个人优势', Boolean(resume.advantage?.trim()))}
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => navigateToEdit('advantage', resume.advantage || '')}
        style={resume.advantage ? styles.textPreview : styles.emptyPreview}
      >
        <Text
          numberOfLines={resume.advantage ? 3 : 2}
          style={resume.advantage ? styles.previewText : styles.emptyPreviewText}
        >
          {resume.advantage || '用 3-5 句话突出你的经验、能力和代表性成果'}
        </Text>
        <Ionicons name="create-outline" size={18} color={CommonColor.normalGrey} />
      </TouchableOpacity>
    </View>
  );

  const renderWorkExpect = () => (
    <View style={styles.sectionCard}>
      {renderSectionHeader('求职期望', workExpectList.length > 0, () => navigateToEdit('workExpect'))}
      {workExpectList.length ? workExpectList.map((item, index) => (
        <TouchableOpacity
          key={`${item.job || 'expect'}-${index}`}
          activeOpacity={0.86}
          onPress={() => navigateToEdit('workExpect', item, index)}
          style={styles.itemRow}
        >
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.job || '未填写职位'}</Text>
            <Text style={styles.itemMeta}>{compactText([item.city, formatSalary(item)]) || '城市、薪资待完善'}</Text>
            <Text style={styles.itemDescription} numberOfLines={1}>
              {(item.industryArr || []).join('、') || '期望行业待完善'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CommonColor.normalGrey} />
        </TouchableOpacity>
      )) : renderEmptyHint('添加求职期望，让招聘方知道你想找什么工作', () => navigateToEdit('workExpect'))}
    </View>
  );

  const renderWorkExperience = () => (
    <View style={styles.sectionCard}>
      {renderSectionHeader('工作经历', workExperienceList.length > 0, () => navigateToEdit('workExperience'))}
      {workExperienceList.length ? workExperienceList.map((item, index) => (
        <TouchableOpacity
          key={`${item.companyFullName || 'work'}-${index}`}
          activeOpacity={0.86}
          onPress={() => navigateToEdit('workExperience', item, index)}
          style={styles.itemRow}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemTitleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.companyFullName || '未填写公司'}</Text>
              <Text style={styles.itemDate}>{formatDateRange(item.workDateStart, item.workDateEnd)}</Text>
            </View>
            <Text style={styles.itemMeta}>{compactText([item.jobName, item.industry]) || '职位、行业待完善'}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>{item.workDetail || '工作内容待完善'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CommonColor.normalGrey} />
        </TouchableOpacity>
      )) : renderEmptyHint('添加工作经历，展示你的岗位职责和成果', () => navigateToEdit('workExperience'))}
    </View>
  );

  const renderProjectExperience = () => (
    <View style={styles.sectionCard}>
      {renderSectionHeader('项目经历', projectExperienceList.length > 0, () => navigateToEdit('projectExperience'))}
      {projectExperienceList.length ? projectExperienceList.map((item, index) => (
        <TouchableOpacity
          key={`${item.projectName || 'project'}-${index}`}
          activeOpacity={0.86}
          onPress={() => navigateToEdit('projectExperience', item, index)}
          style={styles.itemRow}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemTitleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.projectName || '未填写项目'}</Text>
              <Text style={styles.itemDate}>{formatDateRange(item.projectDateStart, item.projectDateEnd)}</Text>
            </View>
            <Text style={styles.itemMeta}>{item.projectRole || '项目角色待完善'}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>{item.projectResult || '项目成果待完善'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CommonColor.normalGrey} />
        </TouchableOpacity>
      )) : renderEmptyHint('添加项目经历，补充核心项目和个人贡献', () => navigateToEdit('projectExperience'))}
    </View>
  );

  const renderEduExperience = () => (
    <View style={styles.sectionCard}>
      {renderSectionHeader('教育经历', eduExperienceList.length > 0, () => navigateToEdit('eduExperience'))}
      {eduExperienceList.length ? eduExperienceList.map((item, index) => (
        <TouchableOpacity
          key={`${item.schoolName || 'edu'}-${index}`}
          activeOpacity={0.86}
          onPress={() => navigateToEdit('eduExperience', item, index)}
          style={styles.itemRow}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemTitleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.schoolName || '未填写学校'}</Text>
              <Text style={styles.itemDate}>{compactText([item.yearStart, item.yearEnd]).replace(' · ', ' - ')}</Text>
            </View>
            <Text style={styles.itemMeta}>{compactText([item.educationAttainment, item.major]) || '学历、专业待完善'}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>{item.schoolExp || item.paper || '在校经历待完善'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CommonColor.normalGrey} />
        </TouchableOpacity>
      )) : renderEmptyHint('添加教育经历，完善学校、学历和专业信息', () => navigateToEdit('eduExperience'))}
    </View>
  );

  return (
    <View style={styles.root}>
      {renderHeader()}

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>加载中</Text>
        </View>
      ) : dataLoaded ? (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderScoreCard()}
          {renderProfileCard()}
          {renderAdvantage()}
          {renderWorkExpect()}
          {renderWorkExperience()}
          {renderProjectExperience()}
          {renderEduExperience()}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={42} color={CommonColor.normalGrey} />
          <Text style={styles.emptyTitle}>{errorMessage || '暂无在线简历'}</Text>
          <Text style={styles.emptySubtitle}>可以先创建本机草稿，后端保存接口完成后再同步到云端</Text>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.86}
            onPress={() => navigateToEdit('advantage', '')}
          >
            <Text style={styles.createButtonText}>创建在线简历</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF3',
  },
  headerButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#222222',
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: CommonColor.deepGrey,
    fontSize: 14,
  },
  scoreCard: {
    backgroundColor: CARD_BG,
    borderRadius: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  scoreIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_BG,
  },
  scoreContent: {
    paddingLeft: 50,
    paddingRight: 76,
    minHeight: 48,
  },
  scoreTitle: {
    color: '#222222',
    fontSize: 15,
    fontWeight: '700',
  },
  scoreNumber: {
    color: ACCENT_COLOR,
    fontSize: 26,
    fontWeight: '800',
  },
  scoreUnit: {
    color: ACCENT_COLOR,
    fontSize: 15,
    fontWeight: '700',
  },
  scoreSubtitle: {
    marginTop: 4,
    color: CommonColor.deepGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  scoreButton: {
    position: 'absolute',
    top: 22,
    right: 16,
    height: 30,
    minWidth: 68,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: ACCENT_COLOR,
  },
  scoreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scoreFooter: {
    height: 44,
    marginTop: 14,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  pendingText: {
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: '800',
  },
  pendingLabel: {
    color: CommonColor.deepGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  footerDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
    backgroundColor: CommonColor.line,
  },
  draftText: {
    color: CommonColor.normalGrey,
    fontSize: 12,
  },
  profileCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    paddingRight: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    color: '#222222',
    fontSize: 22,
    fontWeight: '800',
  },
  nameIcon: {
    marginLeft: 7,
  },
  profileMeta: {
    marginTop: 7,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 18,
  },
  profileStatus: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    color: ACCENT_COLOR,
    backgroundColor: ACCENT_BG,
    fontSize: 12,
    fontWeight: '700',
  },
  profileContact: {
    marginTop: 8,
    color: CommonColor.normalGrey,
    fontSize: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F0F3F5',
  },
  sectionCard: {
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderRadius: 8,
    backgroundColor: CARD_BG,
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '800',
  },
  statusPill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDone: {
    backgroundColor: ACCENT_BG,
  },
  statusTodo: {
    backgroundColor: '#FFF6E8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDoneText: {
    color: ACCENT_COLOR,
  },
  statusTodoText: {
    color: '#D88300',
  },
  addButton: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  addButtonText: {
    color: ACCENT_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  textPreview: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 12,
  },
  emptyPreview: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  previewText: {
    flex: 1,
    color: CommonColor.deepGrey,
    fontSize: 14,
    lineHeight: 22,
    paddingRight: 12,
  },
  emptyPreviewText: {
    flex: 1,
    color: CommonColor.normalGrey,
    fontSize: 13,
    lineHeight: 20,
    paddingRight: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CommonColor.line,
  },
  itemContent: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    flex: 1,
    color: '#222222',
    fontSize: 15,
    fontWeight: '800',
  },
  itemDate: {
    marginLeft: 8,
    color: CommonColor.normalGrey,
    fontSize: 12,
  },
  itemMeta: {
    marginTop: 5,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 18,
  },
  itemDescription: {
    marginTop: 5,
    color: CommonColor.normalGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyHint: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CommonColor.line,
  },
  emptyHintText: {
    flex: 1,
    marginLeft: 8,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: PAGE_BG,
  },
  emptyTitle: {
    marginTop: 12,
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 18,
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 21,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
