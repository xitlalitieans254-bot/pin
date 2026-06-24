import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { CommonColor } from '../../common/CommonColor';
import OnboardingStore, { OnboardingOptionItem, OnboardingStatus } from '../../stores/OnboardingStore';

import avatar1 from '../../assets/avatars/avatar_1.png';
import avatar2 from '../../assets/avatars/avatar_2.png';
import avatar3 from '../../assets/avatars/avatar_3.png';
import avatar4 from '../../assets/avatars/avatar_4.png';

type JobseekerStepKey =
  | 'job_preference'
  | 'salary'
  | 'basic_info'
  | 'work_status'
  | 'first_work_time'
  | 'recent_work'
  | 'recent_company'
  | 'work_period'
  | 'skills'
  | 'work_detail'
  | 'education'
  | 'school'
  | 'major'
  | 'education_period'
  | 'advantage'
  | 'avatar';

type JobseekerDraft = Record<JobseekerStepKey, any>;
type AvatarOption = {
  value: string;
  source: ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const wheelItemHeight = 34;
const wheelPanelHeight = 170;
const wheelVerticalPadding = (wheelPanelHeight - wheelItemHeight) / 2;

const jobseekerSteps: Array<{ key: JobseekerStepKey; title: string; subtitle?: string }> = [
  {
    key: 'job_preference',
    title: '完善资料、快速找工作',
    subtitle: '在线简历会向招聘官展示，平台将保护您的隐私',
  },
  {
    key: 'salary',
    title: '你的期望月薪是',
    subtitle: '单位：千元  1K代表1000元',
  },
  {
    key: 'basic_info',
    title: '创建在线简历',
    subtitle: '我们会妥善保护你的隐私信息',
  },
  { key: 'work_status', title: '求职状态' },
  { key: 'first_work_time', title: '你首次参加工作的时间是？' },
  { key: 'recent_work', title: '你最近一份工作是' },
  {
    key: 'recent_company',
    title: '你最近就职的公司是',
    subtitle: '将自动屏蔽该公司，此公司下的BOSS无法看见你的信息，后续你也可以修改添加',
  },
  { key: 'work_period', title: '在这个公司工作的时间段是' },
  { key: 'skills', title: '来告诉我你的技能吧', subtitle: '最多选择 5 个' },
  { key: 'work_detail', title: '请简单介绍一下工作内容' },
  { key: 'education', title: '最高学历' },
  { key: 'school', title: '你毕业于？' },
  { key: 'major', title: '你的专业是' },
  { key: 'education_period', title: '你就读的时间段是' },
  { key: 'advantage', title: '分享一下你的个人优势吧' },
  { key: 'avatar', title: '最后一步，添加头像', subtitle: '上传头像，让招聘官可以快速看到你' },
];

const defaultDraft: JobseekerDraft = {
  job_preference: { isStudent: undefined, city: '', jobs: [], industries: [] },
  salary: { salaryRangeStart: 10, salaryRangeEnd: 20 },
  basic_info: { fullName: '', gender: 0, birthYear: currentYear - 25, birthMonth: 1 },
  work_status: { workStatus: 0, disabledJobseeker: false },
  first_work_time: { year: currentYear - 3, month: currentMonth },
  recent_work: { jobName: '', industry: '' },
  recent_company: { companyFullName: '' },
  work_period: { startYear: currentYear - 2, startMonth: 1, endYear: currentYear, endMonth: currentMonth },
  skills: { skills: [] },
  work_detail: { workDetail: '' },
  education: { highestQualification: 0, highestQualificationType: 0 },
  school: { schoolName: '' },
  major: { major: '' },
  education_period: { yearStart: currentYear - 4, yearEnd: currentYear },
  advantage: { advantage: '' },
  avatar: { avatar: '' },
};

const localAvatarOptions: AvatarOption[] = [
  { value: 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default1.png', source: avatar1 },
  { value: 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default2.png', source: avatar2 },
  { value: 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default3.png', source: avatar3 },
  { value: 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png', source: avatar4 },
];

const AvatarOptionImage = ({
  source,
  fallbackSource,
  style,
}: {
  source?: ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
  style: any;
}) => {
  const [failed, setFailed] = useState(false);
  const displaySource = failed && fallbackSource ? fallbackSource : source;

  useEffect(() => {
    setFailed(false);
  }, [source]);

  if (!displaySource) {
    return null;
  }

  return (
    <Image
      style={style}
      source={displaySource}
      resizeMode="cover"
      onError={() => {
        if (fallbackSource) {
          setFailed(true);
        }
      }}
    />
  );
};

const range = (start: number, end: number) => {
  const result: number[] = [];
  for (let value = start; value <= end; value += 1) {
    result.push(value);
  }
  return result;
};

const salaryWheelValues = range(1, 100);

const toNumber = (value: any, fallback: number = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const mergeDraft = (remoteDraft: any): JobseekerDraft => ({
  ...defaultDraft,
  ...(remoteDraft || {}),
  job_preference: { ...defaultDraft.job_preference, ...(remoteDraft?.job_preference || {}) },
  salary: { ...defaultDraft.salary, ...(remoteDraft?.salary || {}) },
  basic_info: { ...defaultDraft.basic_info, ...(remoteDraft?.basic_info || {}) },
  work_status: { ...defaultDraft.work_status, ...(remoteDraft?.work_status || {}) },
  first_work_time: { ...defaultDraft.first_work_time, ...(remoteDraft?.first_work_time || {}) },
  recent_work: { ...defaultDraft.recent_work, ...(remoteDraft?.recent_work || {}) },
  recent_company: { ...defaultDraft.recent_company, ...(remoteDraft?.recent_company || {}) },
  work_period: { ...defaultDraft.work_period, ...(remoteDraft?.work_period || {}) },
  skills: { ...defaultDraft.skills, ...(remoteDraft?.skills || {}) },
  work_detail: { ...defaultDraft.work_detail, ...(remoteDraft?.work_detail || {}) },
  education: { ...defaultDraft.education, ...(remoteDraft?.education || {}) },
  school: { ...defaultDraft.school, ...(remoteDraft?.school || {}) },
  major: { ...defaultDraft.major, ...(remoteDraft?.major || {}) },
  education_period: { ...defaultDraft.education_period, ...(remoteDraft?.education_period || {}) },
  advantage: { ...defaultDraft.advantage, ...(remoteDraft?.advantage || {}) },
  avatar: { ...defaultDraft.avatar, ...(remoteDraft?.avatar || {}) },
});

const getInitialStepIndex = (status?: OnboardingStatus) => {
  if (status?.currentStep) {
    const stepIndex = jobseekerSteps.findIndex(step => step.key === status.currentStep);
    if (stepIndex >= 0) {
      return stepIndex;
    }
  }

  const rawIndex = toNumber(status?.currentStepIndex, 0);
  if (rawIndex > 0 && rawIndex <= jobseekerSteps.length) {
    return rawIndex - 1;
  }

  return 0;
};

const getAge = (year: number, month: number) => {
  let age = currentYear - year;
  if (currentMonth < month) {
    age -= 1;
  }
  return age;
};

const getWorkYears = (year: number, month: number) => {
  let years = currentYear - year;
  if (currentMonth < month) {
    years -= 1;
  }
  return Math.max(years, 0);
};

const getWorkExperienceText = (years: number) => {
  if (years >= 10) {
    return '10年以上工作经验';
  }
  if (years <= 0) {
    return '1年以内工作经验';
  }
  return `${years}年工作经验`;
};

type WheelColumnProps = {
  value: number;
  values: number[];
  onValueChange: (value: number) => void;
  suffix: string;
};

const WheelColumn = ({ value, values, onValueChange, suffix }: WheelColumnProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = values.length > 0 ? Math.max(values.findIndex(item => item === value), 0) : 0;
  const [activeIndex, setActiveIndexState] = useState(selectedIndex);
  const activeIndexRef = useRef(selectedIndex);
  const draggingRef = useRef(false);
  const momentumStartedRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveIndex = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndexState(index);
  };

  const clearScrollEndTimer = () => {
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  };

  const getIndexFromOffset = (offsetY: number) => {
    if (values.length === 0) {
      return 0;
    }

    const rawIndex = Math.round(offsetY / wheelItemHeight);
    return Math.max(0, Math.min(rawIndex, values.length - 1));
  };

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }

    setActiveIndex(selectedIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * wheelItemHeight,
        animated: false,
      });
    });
  }, [selectedIndex, values.length]);

  useEffect(() => () => {
    clearScrollEndTimer();
  }, []);

  const settleScroll = (offsetY: number) => {
    const nextIndex = getIndexFromOffset(offsetY);
    const nextValue = values[nextIndex];

    draggingRef.current = false;
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({
      y: nextIndex * wheelItemHeight,
      animated: true,
    });

    if (nextValue != null && nextValue !== value) {
      onValueChange(nextValue);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = getIndexFromOffset(event.nativeEvent.contentOffset.y);
    if (nextIndex !== activeIndexRef.current) {
      setActiveIndex(nextIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    draggingRef.current = true;
    clearScrollEndTimer();
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    clearScrollEndTimer();
    scrollEndTimerRef.current = setTimeout(() => {
      if (!momentumStartedRef.current) {
        settleScroll(offsetY);
      }
    }, 80);
  };

  const handleMomentumScrollBegin = () => {
    momentumStartedRef.current = true;
    clearScrollEndTimer();
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    momentumStartedRef.current = false;
    clearScrollEndTimer();
    settleScroll(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.wheelColumn}>
      <ScrollView
        ref={scrollRef}
        style={styles.wheelScroll}
        contentContainerStyle={styles.wheelScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        snapToInterval={wheelItemHeight}
        snapToAlignment="center"
        decelerationRate="normal"
        bounces={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {values.map((item, index) => {
          const distance = Math.abs(index - activeIndex);
          const near = distance === 1;
          const far = distance > 1;

          return (
            <TouchableOpacity
              key={`${suffix}-${item}`}
              activeOpacity={0.74}
              style={styles.wheelItem}
              onPress={() => onValueChange(item)}
            >
              <Text
                style={[
                  styles.wheelText,
                  near && styles.wheelTextNear,
                  far && styles.wheelTextFar,
                  index === activeIndex && styles.wheelTextSelected,
                ]}
              >
                {`${item}${suffix}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default observer(() => {
  const store = useLocalStore(() => new OnboardingStore());
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const onboardingStatus = params?.onboardingStatus as OnboardingStatus | undefined;
  const [stepIndex, setStepIndex] = useState(() => getInitialStepIndex(onboardingStatus));
  const [draft, setDraft] = useState<JobseekerDraft>(() => mergeDraft(onboardingStatus?.draft || {}));
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [jobSelectorOpen, setJobSelectorOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const step = jobseekerSteps[stepIndex];
  const progress = (stepIndex + 1) / jobseekerSteps.length;
  const activeCategory = store.options.jobCategories[categoryIndex] || store.options.jobCategories[0];
  const salaryValues = salaryWheelValues;
  const remoteAvatarOptions = useMemo<AvatarOption[]>(() => (
    store.options.virtualAvatars
      .filter(Boolean)
      .map((url, index) => ({
        value: url,
        source: { uri: url },
        fallbackSource: localAvatarOptions[index % localAvatarOptions.length].source,
      }))
  ), [store.options.virtualAvatars]);
  const avatarOptions = useMemo<AvatarOption[]>(() => {
    const seen = new Set<string>();

    return [...localAvatarOptions, ...remoteAvatarOptions]
      .filter(option => {
        if (!option.value || seen.has(option.value)) {
          return false;
        }

        seen.add(option.value);
        return true;
      })
      .slice(0, 8);
  }, [remoteAvatarOptions]);

  useEffect(() => {
    setJobSelectorOpen(false);
    setCityPickerOpen(false);
  }, [stepIndex]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      store.requestOptions().catch(() => undefined),
      store.requestDraft('JOBSEEKER').catch(() => undefined),
    ])
      .then(([, draftRes]) => {
        if (!active) {
          return;
        }

        if (draftRes?.code === 0) {
          const remoteDraft = draftRes.data?.draft || draftRes.data || {};
          setDraft(current => mergeDraft({ ...current, ...remoteDraft }));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateStep = (key: JobseekerStepKey, value: any) => {
    setDraft(current => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...value,
      },
    }));
  };

  const toggleArrayValue = (key: JobseekerStepKey, field: string, value: string, max: number) => {
    const list = Array.isArray(draft[key]?.[field]) ? draft[key][field] : [];
    const hasValue = list.includes(value);
    if (!hasValue && list.length >= max) {
      Alert.alert('已达上限', `最多选择 ${max} 个`);
      return;
    }

    const nextList = hasValue ? list.filter((item: string) => item !== value) : [...list, value];
    updateStep(key, { [field]: nextList });
  };

  const validateStep = () => {
    const current = draft[step.key];
    if (step.key === 'job_preference') {
      if (typeof current.isStudent !== 'boolean') {
        Alert.alert('请选择是否为学生');
        return false;
      }
      if (!current.city) {
        Alert.alert('请选择希望工作的城市');
        return false;
      }
      if (!Array.isArray(current.jobs) || current.jobs.length === 0) {
        Alert.alert('请选择期望职位');
        return false;
      }
    }

    if (step.key === 'salary') {
      if (toNumber(current.salaryRangeEnd) < toNumber(current.salaryRangeStart)) {
        Alert.alert('薪资范围不正确', '最高薪资不能低于最低薪资');
        return false;
      }
    }

    if (step.key === 'basic_info') {
      if (!String(current.fullName || '').trim()) {
        Alert.alert('请填写姓名');
        return false;
      }
      if (![1, 2].includes(Number(current.gender))) {
        Alert.alert('请选择性别');
        return false;
      }
      if (getAge(toNumber(current.birthYear), toNumber(current.birthMonth)) < 18) {
        Alert.alert('请确认出生年月', '注册 AI智聘 需要确保你已年满 18 周岁');
        return false;
      }
    }

    if (step.key === 'work_status' && !current.workStatus) {
      Alert.alert('请选择求职状态');
      return false;
    }

    if (step.key === 'recent_work') {
      if (!String(current.jobName || '').trim()) {
        Alert.alert('请选择或填写最近一份职位');
        return false;
      }
    }

    if (step.key === 'recent_company' && !String(current.companyFullName || '').trim()) {
      Alert.alert('请填写最近就职公司');
      return false;
    }

    if (step.key === 'skills' && (!Array.isArray(current.skills) || current.skills.length === 0)) {
      Alert.alert('请选择技能标签');
      return false;
    }

    if (step.key === 'work_detail' && !String(current.workDetail || '').trim()) {
      Alert.alert('请简单介绍工作内容');
      return false;
    }

    if (step.key === 'education') {
      const qualification = toNumber(current.highestQualification);
      if (!qualification) {
        Alert.alert('请选择最高学历');
        return false;
      }
      if (qualification >= 3 && !current.highestQualificationType) {
        Alert.alert('请选择学历类型');
        return false;
      }
    }

    if (step.key === 'school' && !String(current.schoolName || '').trim()) {
      Alert.alert('请填写毕业学校');
      return false;
    }

    if (step.key === 'major' && !String(current.major || '').trim()) {
      Alert.alert('请填写专业');
      return false;
    }

    if (step.key === 'advantage' && !String(current.advantage || '').trim()) {
      Alert.alert('请填写个人优势');
      return false;
    }

    if (step.key === 'avatar' && !String(current.avatar || '').trim()) {
      Alert.alert('请选择或上传头像');
      return false;
    }

    return true;
  };

  const goBackStep = () => {
    if (jobSelectorOpen) {
      setJobSelectorOpen(false);
      return;
    }

    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      return;
    }

    navigation.replace('OnboardingRolePage');
  };

  const goNext = async () => {
    if (saving || loading) {
      return;
    }

    if (jobSelectorOpen) {
      if (!Array.isArray(draft.job_preference.jobs) || draft.job_preference.jobs.length === 0) {
        Alert.alert('请选择期望职位');
        return;
      }
      setJobSelectorOpen(false);
      return;
    }

    if (!validateStep()) {
      return;
    }

    setSaving(true);
    try {
      const saveRes = await store.saveDraft('JOBSEEKER', step.key, stepIndex + 1, draft[step.key]);
      if (saveRes?.code !== 0) {
        Alert.alert('保存失败', saveRes?.message || '请稍后再试');
        return;
      }

      if (stepIndex === jobseekerSteps.length - 1) {
        const completeRes = await store.complete('JOBSEEKER');
        if (completeRes?.code !== 0) {
          Alert.alert('提交失败', completeRes?.message || '请检查资料后再试');
          return;
        }
        navigation.replace('TabPage');
        return;
      }

      setStepIndex(stepIndex + 1);
    } catch (error: any) {
      Alert.alert('保存失败', error?.response?.data?.message || error?.message || '网络异常，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatarFromLibrary = () => {
    if (uploadingAvatar) {
      return;
    }

    setAvatarSheetVisible(false);
    launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 360,
      maxHeight: 360,
      quality: 0.3,
      selectionLimit: 1,
      includeBase64: false,
    }, async (res: ImagePickerResponse) => {
      if (res.didCancel) {
        return;
      }

      if (res.errorMessage) {
        Alert.alert('选择头像失败', res.errorMessage);
        return;
      }

      const asset = res.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('选择头像失败', '没有读取到图片，请重新选择。');
        return;
      }

      setUploadingAvatar(true);
      try {
        const fileType = asset.type && asset.type !== 'image/heic' ? asset.type : 'image/jpeg';
        const url = await store.uploadFile(
          asset.uri,
          `avatar-${Date.now()}.jpg`,
          fileType,
        );
        if (!url) {
          Alert.alert('上传失败', '头像上传失败，请稍后再试');
          return;
        }
        updateStep('avatar', { avatar: url });
      } catch (error: any) {
        const status = error?.response?.status;
        Alert.alert('上传失败', status === 413 ? '图片仍然过大，请换一张较小的头像图片。' : (error?.message || '请稍后再试'));
      } finally {
        setUploadingAvatar(false);
      }
    });
  };

  const renderChips = (
    items: OnboardingOptionItem[],
    selectedValues: string[],
    onPress: (value: string) => void,
  ) => (
    <View style={styles.chipGrid}>
      {items.map(item => {
        const selected = selectedValues.includes(item.value);
        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.76}
            style={selected ? styles.chipSelected : styles.chip}
            onPress={() => onPress(item.value)}
          >
            <Text style={selected ? styles.chipTextSelected : styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderJobOptionGrid = (
    items: OnboardingOptionItem[],
    selectedValues: string[],
    onPress: (value: string) => void,
  ) => (
    <View style={styles.jobOptionGrid}>
      {items.map(item => {
        const selected = selectedValues.includes(item.value);
        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.76}
            style={selected ? styles.jobOptionSelected : styles.jobOption}
            onPress={() => onPress(item.value)}
          >
            <Text style={selected ? styles.jobOptionTextSelected : styles.jobOptionText} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderWheelPanel = (
    columns: Array<{
      key: string;
      value: number;
      values: number[];
      onValueChange: (value: number) => void;
      suffix: string;
    }>,
    panelStyle?: any,
    selectionBarStyle?: any,
  ) => (
    <View style={[styles.wheelPanel, panelStyle]}>
      <View pointerEvents="none" style={[styles.wheelSelectionBar, selectionBarStyle]} />
      {columns.map(column => (
        <View key={column.key} style={styles.wheelColumnWrap}>
          <WheelColumn
            value={column.value}
            values={column.values}
            onValueChange={column.onValueChange}
            suffix={column.suffix}
          />
        </View>
      ))}
    </View>
  );

  const renderPicker = (value: number, values: number[], onValueChange: (value: number) => void, suffix: string) => (
    renderWheelPanel([
      { key: 'value', value, values, onValueChange, suffix },
    ], styles.singleWheelPanel)
  );

  const renderSelectRow = (value: string, placeholder: string, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.78} style={styles.selectRow} onPress={onPress}>
      <Text style={value ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={CommonColor.normalGrey} />
    </TouchableOpacity>
  );

  const renderCityPicker = () => {
    if (!cityPickerOpen) {
      return null;
    }

    return (
      <View style={styles.inlinePickerPanel}>
        {renderChips(store.options.cities, [draft.job_preference.city].filter(Boolean), value => {
          updateStep('job_preference', { city: value });
          setCityPickerOpen(false);
        })}
      </View>
    );
  };

  const renderYearMonthPickers = (
    year: number,
    month: number,
    years: number[],
    onChange: (year: number, month: number) => void,
  ) => (
    renderWheelPanel([
      { key: 'year', value: year, values: years, onValueChange: nextYear => onChange(nextYear, month), suffix: '年' },
      { key: 'month', value: month, values: range(1, 12), onValueChange: nextMonth => onChange(year, nextMonth), suffix: '月' },
    ], styles.yearMonthWheelPanel)
  );

  const renderJobCategorySelector = (multi: boolean) => {
    const selectedJobs = multi ? (draft.job_preference.jobs || []) : [draft.recent_work.jobName].filter(Boolean);
    const children = activeCategory?.children?.length ? activeCategory.children : [];

    return (
      <View style={styles.categoryBox}>
        <View style={styles.categoryLeftPane}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {store.options.jobCategories.map((category, index) => (
              <TouchableOpacity
                key={category.value}
                style={index === categoryIndex ? styles.categoryLeftItemActive : styles.categoryLeftItem}
                onPress={() => setCategoryIndex(index)}
              >
                <Text style={index === categoryIndex ? styles.categoryLeftTextActive : styles.categoryLeftText}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.categoryRightPane}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderJobOptionGrid(children, selectedJobs, (value) => {
              if (multi) {
                toggleArrayValue('job_preference', 'jobs', value, 3);
              } else {
                updateStep('recent_work', {
                  jobName: value,
                  industry: activeCategory?.label || draft.recent_work.industry,
                });
              }
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderJobSelectorPage = () => (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={22} color={CommonColor.normalGrey} />
        <TextInput
          style={styles.searchInput}
          value=""
          placeholder="搜索职位名称"
          placeholderTextColor={CommonColor.normalGrey}
          editable={false}
        />
      </View>
      <View style={styles.selectorTabRow}>
        <Text style={styles.selectorActiveTab}>为你推荐</Text>
        <Text style={styles.selectorGuessTitle}>猜你想找</Text>
      </View>
      {renderJobCategorySelector(true)}
    </>
  );

  const renderTextInput = (
    value: string,
    placeholder: string,
    onChangeText: (value: string) => void,
    multiline: boolean = false,
  ) => (
    <TextInput
      style={multiline ? styles.multilineInput : styles.input}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={CommonColor.normalGrey}
      onChangeText={onChangeText}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );

  const renderSearchTextInput = (
    value: string,
    placeholder: string,
    onChangeText: (value: string) => void,
  ) => (
    <View style={styles.searchBox}>
      <Ionicons name="search-outline" size={22} color={CommonColor.normalGrey} />
      <TextInput
        style={styles.searchEditableInput}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={CommonColor.normalGrey}
        onChangeText={onChangeText}
      />
    </View>
  );

  const renderStepContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={CommonColor.mainColor} />
        </View>
      );
    }

    if (step.key === 'job_preference') {
      if (jobSelectorOpen) {
        return renderJobSelectorPage();
      }

      const selectedJobsText = Array.isArray(draft.job_preference.jobs) && draft.job_preference.jobs.length > 0
        ? draft.job_preference.jobs.join('、')
        : '';
      const recommendedJobs = (store.options.jobCategories || [])
        .flatMap(category => category.children || [])
        .slice(0, 12);

      return (
        <>
          <Text style={styles.fieldLabel}>你是学生吗？</Text>
          <View style={styles.segmentRow}>
            {[
              { label: '是', value: true },
              { label: '不是', value: false },
            ].map(item => (
              <TouchableOpacity
                key={String(item.value)}
                style={draft.job_preference.isStudent === item.value ? styles.segmentSelected : styles.segment}
                onPress={() => updateStep('job_preference', { isStudent: item.value })}
              >
                <Text style={draft.job_preference.isStudent === item.value ? styles.segmentTextSelected : styles.segmentText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>学生将优先推荐实习、校招岗位，包含在校、应届、往届未入职学生。</Text>

          <Text style={styles.fieldLabel}>希望在哪里工作？</Text>
          {renderSelectRow(draft.job_preference.city, '请选择城市', () => setCityPickerOpen(!cityPickerOpen))}
          {renderCityPicker()}

          <Text style={styles.fieldLabel}>期望的职位是（可多选）</Text>
          {renderSelectRow(selectedJobsText, '请选择期望职位', () => setJobSelectorOpen(true))}
          <Text style={styles.guessTitle}>猜你想找</Text>
          {renderChips(recommendedJobs, draft.job_preference.jobs || [], value => toggleArrayValue('job_preference', 'jobs', value, 3))}
        </>
      );
    }

    if (step.key === 'salary') {
      return (
        <>
          <View style={styles.salaryLabelRow}>
            <Text style={styles.salaryLabel}>最低薪资</Text>
            <Text style={styles.salaryLabel}>最高薪资</Text>
          </View>
          {renderWheelPanel([
            {
              key: 'min',
              value: toNumber(draft.salary.salaryRangeStart, 10),
              values: salaryValues,
              onValueChange: value => updateStep('salary', { salaryRangeStart: value }),
              suffix: 'K',
            },
            {
              key: 'max',
              value: toNumber(draft.salary.salaryRangeEnd, 20),
              values: salaryValues,
              onValueChange: value => updateStep('salary', { salaryRangeEnd: value }),
              suffix: 'K',
            },
          ], styles.salaryWheelPanel)}
        </>
      );
    }

    if (step.key === 'basic_info') {
      return (
        <>
          <Text style={styles.fieldLabel}>你的姓名</Text>
          {renderTextInput(draft.basic_info.fullName || '', '请输入真实姓名', text => updateStep('basic_info', { fullName: text }))}
          <Text style={styles.fieldLabel}>性别</Text>
          <View style={styles.segmentRow}>
            {[
              { label: '男', value: 1 },
              { label: '女', value: 2 },
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={Number(draft.basic_info.gender) === item.value ? styles.segmentSelected : styles.segment}
                onPress={() => updateStep('basic_info', { gender: item.value })}
              >
                <Text style={Number(draft.basic_info.gender) === item.value ? styles.segmentTextSelected : styles.segmentText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>出生年月</Text>
          {renderYearMonthPickers(
            toNumber(draft.basic_info.birthYear, currentYear - 25),
            toNumber(draft.basic_info.birthMonth, 1),
            range(1950, currentYear - 18),
            (birthYear, birthMonth) => updateStep('basic_info', { birthYear, birthMonth }),
          )}
          <Text style={styles.legalText}>
            根据《劳动法》、《未成年人保护法》等相关法律规定，申请注册 AI智聘，请选择与你身份证一致的真实年龄并确保你已年满 18 周岁。
          </Text>
        </>
      );
    }

    if (step.key === 'work_status') {
      const selectedStatus = String(draft.work_status.workStatus || '');
      return (
        <>
          <View style={styles.statusGrid}>
            {store.options.workStatuses.slice(0, 4).map(item => {
              const selected = selectedStatus === item.value || selectedStatus === item.label;
              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.76}
                  style={selected ? styles.statusOptionSelected : styles.statusOption}
                  onPress={() => updateStep('work_status', { workStatus: Number(item.value) || item.value })}
                >
                  <Text style={selected ? styles.statusOptionTextSelected : styles.statusOptionText}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.statusHelp}>求职状态会影响到你被推荐的频率，以及Boss的决策</Text>
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.disabilityRow}
            onPress={() => updateStep('work_status', { disabledJobseeker: !draft.work_status.disabledJobseeker })}
          >
            <Ionicons
              name={draft.work_status.disabledJobseeker ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={draft.work_status.disabledJobseeker ? CommonColor.mainColor : '#CDD1D8'}
            />
            <View style={styles.disabilityTextWrap}>
              <Text style={styles.disabilityTitle}>残障人士求职</Text>
              <Text style={styles.disabilitySubtitle}>可根据你的身体状况推荐更合适的职位</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }

    if (step.key === 'first_work_time') {
      return (
        <>
          {renderYearMonthPickers(
            toNumber(draft.first_work_time.year, currentYear - 3),
            toNumber(draft.first_work_time.month, currentMonth),
            range(1980, currentYear),
            (year, month) => updateStep('first_work_time', { year, month }),
          )}
        </>
      );
    }

    if (step.key === 'recent_work') {
      return (
        <>
          {renderSearchTextInput(draft.recent_work.jobName || '', '输入职位名称', text => updateStep('recent_work', { jobName: text }))}
          <View style={styles.selectorTabRow}>
            <Text style={styles.selectorActiveTab}>为你推荐</Text>
            <Text style={styles.selectorGuessTitle}>猜你做过</Text>
          </View>
          {renderJobCategorySelector(false)}
        </>
      );
    }

    if (step.key === 'recent_company') {
      return renderSearchTextInput(
        draft.recent_company.companyFullName || '',
        '搜索公司，也可手动输入～',
        text => updateStep('recent_company', { companyFullName: text }),
      );
    }

    if (step.key === 'work_period') {
      return (
        <>
          <Text style={styles.fieldLabel}>入职时间</Text>
          {renderYearMonthPickers(
            toNumber(draft.work_period.startYear, currentYear - 2),
            toNumber(draft.work_period.startMonth, 1),
            range(1980, currentYear),
            (startYear, startMonth) => updateStep('work_period', { startYear, startMonth }),
          )}
          <Text style={styles.fieldLabel}>离职时间</Text>
          {renderYearMonthPickers(
            toNumber(draft.work_period.endYear, currentYear),
            toNumber(draft.work_period.endMonth, currentMonth),
            range(1980, currentYear),
            (endYear, endMonth) => updateStep('work_period', { endYear, endMonth }),
          )}
        </>
      );
    }

    if (step.key === 'skills') {
      return renderChips(store.options.skills, draft.skills.skills || [], value => toggleArrayValue('skills', 'skills', value, 5));
    }

    if (step.key === 'work_detail') {
      return renderTextInput(draft.work_detail.workDetail || '', '例如：负责 AI 招聘产品规划、需求推进、数据分析和跨团队协作。', text => updateStep('work_detail', { workDetail: text }), true);
    }

    if (step.key === 'education') {
      const qualification = toNumber(draft.education.highestQualification);
      return (
        <>
          {renderChips(store.options.educations, [String(qualification || '')], value => updateStep('education', { highestQualification: Number(value) || value }))}
          {qualification >= 3 ? (
            <>
              <Text style={styles.fieldLabel}>类型</Text>
              {renderChips([
                { label: '全日制', value: '1' },
                { label: '非全日制', value: '2' },
              ], [String(draft.education.highestQualificationType || '')], value => updateStep('education', { highestQualificationType: Number(value) }))}
            </>
          ) : null}
        </>
      );
    }

    if (step.key === 'school') {
      return renderTextInput(draft.school.schoolName || '', '请输入学校名称', text => updateStep('school', { schoolName: text }));
    }

    if (step.key === 'major') {
      return renderTextInput(draft.major.major || '', '请输入专业名称', text => updateStep('major', { major: text }));
    }

    if (step.key === 'education_period') {
      return (
        <>
          <Text style={styles.fieldLabel}>入学年份</Text>
          {renderPicker(toNumber(draft.education_period.yearStart, currentYear - 4), range(1980, currentYear), value => updateStep('education_period', { yearStart: value }), '年')}
          <Text style={styles.fieldLabel}>毕业年份</Text>
          {renderPicker(toNumber(draft.education_period.yearEnd, currentYear), range(1980, currentYear + 6), value => updateStep('education_period', { yearEnd: value }), '年')}
        </>
      );
    }

    if (step.key === 'advantage') {
      return renderTextInput(draft.advantage.advantage || '', '例如：熟悉 AI 产品从 0 到 1 搭建，能结合业务目标快速推进落地。', text => updateStep('advantage', { advantage: text }), true);
    }

    const selectedAvatar = avatarOptions.find(item => item.value === draft.avatar.avatar);
    const selectedAvatarSource = selectedAvatar?.source || (draft.avatar.avatar ? { uri: draft.avatar.avatar } : undefined);
    const selectedAvatarFallbackSource = selectedAvatar?.fallbackSource || localAvatarOptions[0].source;
    return (
      <View style={styles.avatarContent}>
        <View style={styles.avatarPreview}>
          {selectedAvatarSource ? (
            <AvatarOptionImage
              style={styles.avatarImage}
              source={selectedAvatarSource}
              fallbackSource={selectedAvatarFallbackSource}
            />
          ) : (
            <Ionicons name="person" size={52} color={CommonColor.mainColor} />
          )}
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={() => setAvatarSheetVisible(true)} activeOpacity={uploadingAvatar ? 1 : 0.86}>
          {uploadingAvatar ? <ActivityIndicator color={CommonColor.mainColor} /> : <Text style={styles.uploadButtonText}>上传头像</Text>}
        </TouchableOpacity>
        <Text style={styles.fieldLabel}>也可以选择虚拟头像</Text>
        <View style={styles.avatarGrid}>
          {avatarOptions.map(option => (
            <TouchableOpacity key={option.value} style={draft.avatar.avatar === option.value ? styles.avatarOptionSelected : styles.avatarOption} onPress={() => updateStep('avatar', { avatar: option.value })}>
              <AvatarOptionImage
                style={styles.avatarOptionImage}
                source={option.source}
                fallbackSource={option.fallbackSource}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const firstWorkYears = getWorkYears(
    toNumber(draft.first_work_time.year, currentYear),
    toNumber(draft.first_work_time.month, currentMonth),
  );
  const firstWorkSubtitle = getWorkExperienceText(firstWorkYears);
  const displayTitle = jobSelectorOpen ? '你的期望职位是' : step.title;
  const displaySubtitle = jobSelectorOpen
    ? undefined
    : step.key === 'first_work_time'
      ? firstWorkSubtitle
      : step.subtitle;
  const selectedJobCount = draft.job_preference.jobs?.length || 0;
  const canProceed = (() => {
    if (step.key === 'job_preference') {
      return typeof draft.job_preference.isStudent === 'boolean' && !!draft.job_preference.city && selectedJobCount > 0;
    }
    if (step.key === 'basic_info') {
      return Boolean(String(draft.basic_info.fullName || '').trim()) && [1, 2].includes(Number(draft.basic_info.gender));
    }
    if (step.key === 'work_status') {
      return Boolean(draft.work_status.workStatus);
    }
    if (step.key === 'recent_work') {
      return Boolean(String(draft.recent_work.jobName || '').trim());
    }
    if (step.key === 'recent_company') {
      return Boolean(String(draft.recent_company.companyFullName || '').trim());
    }
    return true;
  })();
  const buttonText = stepIndex === jobseekerSteps.length - 1 ? '开启求职之旅' : '下一步';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top - 38, 4) }]}>
        <Text style={styles.brand}>AI智聘</Text>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={goBackStep}>
            <Ionicons name="chevron-back" size={24} color={CommonColor.fontColor} />
          </TouchableOpacity>
          {jobSelectorOpen ? (
            <TouchableOpacity style={styles.saveButton} activeOpacity={0.74} onPress={goNext}>
              <Text style={styles.saveText}>保存</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.stepCount} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        scrollEnabled={step.key !== 'salary'}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step.key === 'work_status' && !jobSelectorOpen ? (
          <View style={styles.statusHeroIcon}>
            <View style={styles.statusHeroBadge}>
              <Ionicons name="person" size={23} color="white" />
            </View>
            <View style={styles.statusHeroSquare} />
          </View>
        ) : null}
        {jobSelectorOpen ? (
          <View style={styles.titleRow}>
            <Text style={styles.title}>{displayTitle}</Text>
            <Text style={styles.titleCount}><Text style={styles.titleCountActive}>{selectedJobCount}</Text>/3</Text>
          </View>
        ) : (
          <Text style={styles.title}>{displayTitle}</Text>
        )}
        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}
        <View style={styles.stepBody}>{renderStepContent()}</View>
      </ScrollView>

      {!jobSelectorOpen ? <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={canProceed ? styles.primaryButton : styles.primaryButtonDisabled}
          onPress={goNext}
          activeOpacity={saving || loading || !canProceed ? 1 : 0.86}
          disabled={saving || loading || !canProceed}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{buttonText}</Text>}
        </TouchableOpacity>
      </View> : null}

      <Modal
        visible={avatarSheetVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarSheetVisible(false)}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setAvatarSheetVisible(false)}>
          <View style={[styles.avatarSheet, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity style={styles.sheetAction} activeOpacity={0.82} onPress={pickAvatarFromLibrary}>
              <Text style={styles.sheetActionText}>从相册中选择</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} activeOpacity={0.82} onPress={() => setAvatarSheetVisible(false)}>
              <Text style={styles.sheetCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  navRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brand: {
    textAlign: 'center',
    color: CommonColor.mainColor,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  stepCount: {
    width: 44,
    height: 44,
    textAlign: 'right',
    color: CommonColor.deepGrey,
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveText: {
    color: CommonColor.normalGrey,
    fontSize: 15,
    fontWeight: '500',
  },
  progressTrack: {
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(36, 59, 90, 0.10)',
    overflow: 'hidden',
  },
  progressValue: {
    height: 3,
    borderRadius: 3,
    backgroundColor: CommonColor.mainColor,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    color: CommonColor.fontColor,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  titleCount: {
    color: CommonColor.fontColor,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '800',
  },
  titleCountActive: {
    color: CommonColor.mainColor,
  },
  subtitle: {
    marginTop: 10,
    color: CommonColor.deepGrey,
    fontSize: 14,
    lineHeight: 20,
  },
  stepBody: {
    marginTop: 28,
  },
  loadingBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C9CDD3',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  selectText: {
    flex: 1,
    paddingRight: 8,
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '500',
  },
  selectPlaceholder: {
    flex: 1,
    paddingRight: 8,
    color: CommonColor.normalGrey,
    fontSize: 16,
  },
  inlinePickerPanel: {
    marginTop: 10,
  },
  guessTitle: {
    marginTop: 18,
    marginBottom: 12,
    color: CommonColor.normalGrey,
    fontSize: 14,
    fontWeight: '700',
  },
  searchBox: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C9CDD3',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: CommonColor.fontColor,
    fontSize: 16,
    backgroundColor: 'white',
  },
  searchEditableInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: CommonColor.fontColor,
    fontSize: 16,
    backgroundColor: 'white',
  },
  selectorTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -28,
    marginTop: 28,
    marginBottom: 0,
  },
  selectorActiveTab: {
    width: 112,
    paddingLeft: 28,
    paddingVertical: 13,
    borderLeftWidth: 4,
    borderLeftColor: CommonColor.mainColor,
    color: CommonColor.mainColor,
    fontSize: 16,
    fontWeight: '800',
  },
  selectorGuessTitle: {
    flex: 1,
    paddingLeft: 18,
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    marginTop: 26,
    marginBottom: 14,
    color: CommonColor.fontColor,
    fontSize: 19,
    fontWeight: '800',
  },
  helperText: {
    marginTop: 12,
    color: CommonColor.normalGrey,
    fontSize: 13,
    lineHeight: 20,
  },
  legalText: {
    marginTop: 28,
    color: CommonColor.normalGrey,
    fontSize: 12,
    lineHeight: 19,
  },
  statusHeroIcon: {
    width: 58,
    height: 54,
    marginTop: 36,
    marginBottom: 52,
  },
  statusHeroBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: CommonColor.mainColor,
  },
  statusHeroSquare: {
    position: 'absolute',
    right: 6,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#FFB07C',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusOption: {
    width: '48%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 6,
    backgroundColor: '#F6F7F8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    width: '48%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 6,
    backgroundColor: CommonColor.transparentMainColor,
    borderWidth: 1.5,
    borderColor: CommonColor.mainColor,
  },
  statusOptionText: {
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '800',
  },
  statusOptionTextSelected: {
    color: CommonColor.mainColor,
    fontSize: 16,
    fontWeight: '800',
  },
  statusHelp: {
    marginTop: 22,
    color: CommonColor.normalGrey,
    fontSize: 14,
    lineHeight: 21,
  },
  disabilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 34,
  },
  disabilityTextWrap: {
    flex: 1,
    marginLeft: 16,
  },
  disabilityTitle: {
    color: CommonColor.fontColor,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  disabilitySubtitle: {
    marginTop: 7,
    color: CommonColor.normalGrey,
    fontSize: 14,
    lineHeight: 21,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  segment: {
    flex: 1,
    height: 58,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F6F7F8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  segmentSelected: {
    flex: 1,
    height: 58,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: CommonColor.transparentMainColor,
    borderWidth: 1.5,
    borderColor: CommonColor.mainColor,
  },
  segmentText: {
    color: CommonColor.fontColor,
    fontSize: 17,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: CommonColor.mainColor,
    fontSize: 17,
    fontWeight: '800',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginTop: -10,
  },
  chip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginHorizontal: 5,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: '#F6F7F8',
  },
  chipSelected: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginHorizontal: 5,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: CommonColor.transparentMainColor,
    borderWidth: 1,
    borderColor: CommonColor.mainColor,
  },
  chipText: {
    color: CommonColor.fontColor,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: CommonColor.mainColor,
    fontSize: 15,
    fontWeight: '800',
  },
  categoryBox: {
    height: 620,
    flexDirection: 'row',
    marginHorizontal: -28,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  categoryLeftPane: {
    width: 112,
    backgroundColor: '#F6F7F8',
  },
  categoryLeftItem: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  categoryLeftItemActive: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: CommonColor.mainColor,
  },
  categoryLeftText: {
    color: CommonColor.fontColor,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryLeftTextActive: {
    color: CommonColor.mainColor,
    fontSize: 15,
    fontWeight: '800',
  },
  categoryRightPane: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  jobOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  jobOption: {
    width: '48.5%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: '#F6F7F8',
  },
  jobOptionSelected: {
    width: '48.5%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: CommonColor.transparentMainColor,
    borderWidth: 1,
    borderColor: CommonColor.mainColor,
  },
  jobOptionText: {
    color: CommonColor.fontColor,
    fontSize: 14,
    fontWeight: '600',
  },
  jobOptionTextSelected: {
    color: CommonColor.mainColor,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    height: 54,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C9CDD3',
    borderRadius: 6,
    color: CommonColor.fontColor,
    fontSize: 16,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 170,
    padding: 14,
    borderRadius: 3,
    backgroundColor: '#F6F7F8',
    color: CommonColor.fontColor,
    fontSize: 15,
    lineHeight: 22,
  },
  wheelPanel: {
    height: wheelPanelHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 0,
    overflow: 'hidden',
  },
  yearMonthWheelPanel: {
    marginTop: 78,
  },
  singleWheelPanel: {
    marginTop: 12,
  },
  salaryWheelPanel: {
    marginTop: 122,
    backgroundColor: 'white',
    borderRadius: 0,
  },
  wheelSelectionBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 64,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#ECEEF2',
  },
  wheelColumnWrap: {
    flex: 1,
  },
  wheelColumn: {
    height: wheelPanelHeight,
    justifyContent: 'center',
  },
  wheelScroll: {
    height: wheelPanelHeight,
  },
  wheelScrollContent: {
    paddingVertical: wheelVerticalPadding,
  },
  wheelItem: {
    height: wheelItemHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    color: '#CDD2DA',
    fontSize: 18,
    fontWeight: '600',
  },
  wheelTextNear: {
    color: '#AEB5BF',
    fontSize: 21,
  },
  wheelTextFar: {
    color: '#D8DDE4',
    fontSize: 16,
  },
  wheelTextSelected: {
    color: CommonColor.fontColor,
    fontSize: 27,
    fontWeight: '700',
  },
  salaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 42,
    marginTop: 24,
  },
  salaryLabel: {
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarContent: {
    alignItems: 'center',
  },
  avatarPreview: {
    width: 118,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 59,
    backgroundColor: CommonColor.transparentMainColor,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 118,
    height: 118,
  },
  uploadButton: {
    height: 38,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: CommonColor.transparentMainColor,
    marginTop: 16,
  },
  uploadButtonText: {
    color: CommonColor.mainColor,
    fontSize: 13,
    fontWeight: '800',
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  avatarOption: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginHorizontal: 8,
    marginTop: 10,
    overflow: 'hidden',
    backgroundColor: '#EEF3F8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginHorizontal: 8,
    marginTop: 10,
    overflow: 'hidden',
    backgroundColor: '#EEF3F8',
    borderWidth: 2,
    borderColor: CommonColor.mainColor,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 28,
    backgroundColor: 'white',
  },
  primaryButton: {
    height: 52,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.mainColor,
  },
  primaryButtonDisabled: {
    height: 52,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 59, 90, 0.34)',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  avatarSheet: {
    paddingHorizontal: 12,
  },
  sheetAction: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'white',
  },
  sheetActionText: {
    color: CommonColor.fontColor,
    fontSize: 15,
    fontWeight: '700',
  },
  sheetCancel: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  sheetCancelText: {
    color: CommonColor.normalGrey,
    fontSize: 15,
    fontWeight: '700',
  },
});
