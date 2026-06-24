import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { CommonColor } from '../../common/CommonColor';
import OnboardingStore, { OnboardingOptionItem, OnboardingStatus } from '../../stores/OnboardingStore';

type BossStepKey =
  | 'company_name'
  | 'company_industry'
  | 'company_scale'
  | 'job_name'
  | 'job_description'
  | 'job_requirements'
  | 'job_address'
  | 'publish_confirm';

type BossDraft = Record<BossStepKey, any>;

const bossSteps: Array<{ key: BossStepKey; title: string; subtitle?: string }> = [
  { key: 'company_name', title: '请填写公司名称', subtitle: '公司营业执照名称，可上传执照图片留档' },
  { key: 'company_industry', title: '选择公司行业' },
  { key: 'company_scale', title: '选择公司规模' },
  { key: 'job_name', title: '发布职位', subtitle: '先填写职位名称，后续可继续完善要求' },
  { key: 'job_description', title: '职位描述', subtitle: '清晰的职责描述会提高候选人沟通意愿' },
  { key: 'job_requirements', title: '继续填写', subtitle: '完善经验、学历、薪资范围' },
  { key: 'job_address', title: '工作地址', subtitle: '第一版先填写文本地址，地图选点后续接入' },
  { key: 'publish_confirm', title: '确认发布', subtitle: '发布后可在“我的职位”中继续编辑' },
];

const defaultDraft: BossDraft = {
  company_name: { companyFullName: '', businessLicense: '' },
  company_industry: { industry: '' },
  company_scale: { companyScale: '' },
  job_name: { jobName: '' },
  job_description: { jobDescription: '' },
  job_requirements: {
    experienceLabel: '1-3年',
    workYearRangeStart: 1,
    workYearRangeEnd: 3,
    educationAttainment: '本科',
    salaryRangeStart: 10,
    salaryRangeEnd: 20,
    jobTags: '社招',
  },
  job_address: { city: '长沙', addressDetail: '' },
  publish_confirm: {},
};

const experienceOptions = [
  { label: '不限', value: '不限', start: 0, end: 0 },
  { label: '1-3年', value: '1-3年', start: 1, end: 3 },
  { label: '3-5年', value: '3-5年', start: 3, end: 5 },
  { label: '5-10年', value: '5-10年', start: 5, end: 10 },
  { label: '10年以上', value: '10年以上', start: 10, end: 99 },
];

const salaryValues = [3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 80];

const toNumber = (value: any, fallback: number = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const mergeDraft = (remoteDraft: any): BossDraft => ({
  ...defaultDraft,
  ...(remoteDraft || {}),
  company_name: { ...defaultDraft.company_name, ...(remoteDraft?.company_name || {}) },
  company_industry: { ...defaultDraft.company_industry, ...(remoteDraft?.company_industry || {}) },
  company_scale: { ...defaultDraft.company_scale, ...(remoteDraft?.company_scale || {}) },
  job_name: { ...defaultDraft.job_name, ...(remoteDraft?.job_name || {}) },
  job_description: { ...defaultDraft.job_description, ...(remoteDraft?.job_description || {}) },
  job_requirements: { ...defaultDraft.job_requirements, ...(remoteDraft?.job_requirements || {}) },
  job_address: { ...defaultDraft.job_address, ...(remoteDraft?.job_address || {}) },
  publish_confirm: { ...defaultDraft.publish_confirm, ...(remoteDraft?.publish_confirm || {}) },
});

const getInitialStepIndex = (status?: OnboardingStatus) => {
  if (status?.currentStep) {
    const stepIndex = bossSteps.findIndex(step => step.key === status.currentStep);
    if (stepIndex >= 0) {
      return stepIndex;
    }
  }

  const rawIndex = toNumber(status?.currentStepIndex, 0);
  if (rawIndex > 0 && rawIndex <= bossSteps.length) {
    return rawIndex - 1;
  }

  return 0;
};

const getEducationLabel = (value: string) => {
  const educationMap: Record<string, string> = {
    '1': '初中及以下',
    '2': '高中',
    '3': '大专',
    '4': '本科',
    '5': '硕士',
    '6': '博士',
  };
  return educationMap[value] || value;
};

const toJsonTextList = (value: string) => {
  const list = String(value || '')
    .split(/[,\s，、]+/)
    .map(item => item.trim())
    .filter(Boolean);

  return JSON.stringify(list);
};

export default observer(() => {
  const store = useLocalStore(() => new OnboardingStore());
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const onboardingStatus = params?.onboardingStatus as OnboardingStatus | undefined;
  const [stepIndex, setStepIndex] = useState(() => getInitialStepIndex(onboardingStatus));
  const [draft, setDraft] = useState<BossDraft>(() => mergeDraft(onboardingStatus?.draft || {}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  const step = bossSteps[stepIndex];
  const progress = (stepIndex + 1) / bossSteps.length;

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      store.requestOptions().catch(() => undefined),
      store.requestDraft('BOSS').catch(() => undefined),
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

  const updateStep = (key: BossStepKey, value: any) => {
    setDraft(current => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...value,
      },
    }));
  };

  const renderChips = (
    items: OnboardingOptionItem[],
    selectedValue: string,
    onPress: (value: string) => void,
  ) => (
    <View style={styles.chipGrid}>
      {items.map(item => {
        const selected = selectedValue === item.value || selectedValue === item.label;
        return (
          <TouchableOpacity key={item.value} style={selected ? styles.chipSelected : styles.chip} onPress={() => onPress(item.value)}>
            <Text style={selected ? styles.chipTextSelected : styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPicker = (value: number, values: number[], onValueChange: (value: number) => void, suffix: string) => (
    <View style={styles.pickerWrap}>
      <Picker selectedValue={value} onValueChange={itemValue => onValueChange(Number(itemValue))}>
        {values.map(item => <Picker.Item key={item} label={`${item}${suffix}`} value={item} />)}
      </Picker>
    </View>
  );

  const renderTextInput = (value: string, placeholder: string, onChangeText: (value: string) => void, multiline: boolean = false) => (
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

  const uploadLicense = () => {
    if (uploadingLicense) {
      return;
    }

    launchImageLibrary({ mediaType: 'photo', quality: 1 }, async (res: ImagePickerResponse) => {
      const asset = res.assets?.[0];
      if (!asset?.uri) {
        return;
      }

      setUploadingLicense(true);
      try {
        const url = await store.uploadFile(
          asset.uri,
          asset.fileName || `business-license-${Date.now()}.jpg`,
          asset.type || 'image/jpeg',
        );
        if (!url) {
          Alert.alert('上传失败', '营业执照图片上传失败，请稍后再试');
          return;
        }
        updateStep('company_name', { businessLicense: url });
      } catch (error: any) {
        Alert.alert('上传失败', error?.message || '请稍后再试');
      } finally {
        setUploadingLicense(false);
      }
    });
  };

  const validateStep = () => {
    if (step.key === 'company_name' && !String(draft.company_name.companyFullName || '').trim()) {
      Alert.alert('请填写公司名称');
      return false;
    }
    if (step.key === 'company_industry' && !draft.company_industry.industry) {
      Alert.alert('请选择公司行业');
      return false;
    }
    if (step.key === 'company_scale' && !draft.company_scale.companyScale) {
      Alert.alert('请选择公司规模');
      return false;
    }
    if (step.key === 'job_name' && !String(draft.job_name.jobName || '').trim()) {
      Alert.alert('请填写职位名称');
      return false;
    }
    if (step.key === 'job_description' && !String(draft.job_description.jobDescription || '').trim()) {
      Alert.alert('请填写职位描述');
      return false;
    }
    if (step.key === 'job_requirements') {
      if (toNumber(draft.job_requirements.salaryRangeEnd) < toNumber(draft.job_requirements.salaryRangeStart)) {
        Alert.alert('薪资范围不正确', '最高薪资不能低于最低薪资');
        return false;
      }
    }
    if (step.key === 'job_address') {
      if (!String(draft.job_address.city || '').trim()) {
        Alert.alert('请选择城市');
        return false;
      }
      if (!String(draft.job_address.addressDetail || '').trim()) {
        Alert.alert('请填写工作地址');
        return false;
      }
    }
    return true;
  };

  const buildCompanyPayload = () => {
    const companyFullName = draft.company_name.companyFullName.trim();
    const industry = String(draft.company_industry.industry || '').trim();

    return {
      companyFullName,
      companyAbbrName: companyFullName.replace(/有限公司|有限责任公司|科技|网络|信息/g, '') || companyFullName,
      industry,
      companyScale: draft.company_scale.companyScale,
      city: draft.job_address.city,
      addressDetail: draft.job_address.addressDetail,
      companyDescription: `${companyFullName}专注于 AI 相关岗位与人才招聘。`,
      mainBusiness: JSON.stringify(industry ? [industry] : []),
    };
  };

  const buildJobPayload = () => ({
    jobName: draft.job_name.jobName.trim(),
    salaryRangeStart: toNumber(draft.job_requirements.salaryRangeStart, 10),
    salaryRangeEnd: toNumber(draft.job_requirements.salaryRangeEnd, 20),
    workYearRangeStart: toNumber(draft.job_requirements.workYearRangeStart, 1),
    workYearRangeEnd: toNumber(draft.job_requirements.workYearRangeEnd, 3),
    educationAttainment: getEducationLabel(String(draft.job_requirements.educationAttainment || '本科')),
    jobTags: toJsonTextList(draft.job_requirements.jobTags || '社招'),
    jobDescription: draft.job_description.jobDescription.trim(),
    city: draft.job_address.city,
    addressDetail: draft.job_address.addressDetail,
    status: 1,
  });

  const completeOnboarding = async () => {
    const companyRes = await store.saveCompany(buildCompanyPayload());
    if (companyRes?.code !== 0) {
      Alert.alert('企业资料保存失败', companyRes?.message || '请稍后再试');
      return false;
    }

    if (draft.company_name.businessLicense) {
      const licenseRes = await store.submitToutouLicense(draft.company_name.businessLicense);
      if (licenseRes?.code !== 0) {
        Alert.alert('营业执照提交失败', licenseRes?.message || '企业资料已保存，营业执照可稍后重试');
        return false;
      }
    }

    const jobRes = await store.saveBossJob(buildJobPayload());
    if (jobRes?.code !== 0) {
      Alert.alert('职位发布失败', jobRes?.message || '请稍后再试');
      return false;
    }

    const completeRes = await store.complete('BOSS');
    if (completeRes?.code !== 0) {
      Alert.alert('完成失败', completeRes?.message || '请稍后再试');
      return false;
    }

    navigation.replace('ToutouTabPage');
    return true;
  };

  const goNext = async () => {
    if (saving || loading) {
      return;
    }
    if (!validateStep()) {
      return;
    }

    setSaving(true);
    try {
      const saveRes = await store.saveDraft('BOSS', step.key, stepIndex + 1, draft[step.key]);
      if (saveRes?.code !== 0) {
        Alert.alert('保存失败', saveRes?.message || '请稍后再试');
        return;
      }

      if (stepIndex === bossSteps.length - 1) {
        await completeOnboarding();
        return;
      }

      setStepIndex(stepIndex + 1);
    } catch (error: any) {
      Alert.alert('保存失败', error?.response?.data?.message || error?.message || '网络异常，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const goBackStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      return;
    }
    navigation.replace('OnboardingRolePage');
  };

  const fillAiDescription = () => {
    const jobName = draft.job_name.jobName || 'AI岗位';
    const companyName = draft.company_name.companyFullName || '公司';
    updateStep('job_description', {
      jobDescription: `${companyName}正在招聘${jobName}，负责 AI 相关业务需求分析、方案设计与落地推进。需要具备良好的沟通协作能力，能够结合业务目标推动产品、技术和运营团队高效配合，并持续关注 AI 工具与行业实践。`,
    });
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={CommonColor.mainColor} />
        </View>
      );
    }

    if (step.key === 'company_name') {
      return (
        <>
          <Text style={styles.fieldLabel}>公司营业执照名称</Text>
          {renderTextInput(draft.company_name.companyFullName || '', '请输入公司名称', text => updateStep('company_name', { companyFullName: text }))}
          <TouchableOpacity style={styles.licenseCard} activeOpacity={0.86} onPress={uploadLicense}>
            {draft.company_name.businessLicense ? (
              <Image style={styles.licenseImage} source={{ uri: draft.company_name.businessLicense }} />
            ) : (
              <View style={styles.licenseIconWrap}>
                <Ionicons name="image-outline" size={30} color={CommonColor.mainColor} />
              </View>
            )}
            <View style={styles.licenseTextWrap}>
              <Text style={styles.licenseTitle}>{uploadingLicense ? '上传中...' : '上传营业执照'}</Text>
              <Text style={styles.licenseSubtitle}>OCR 识别后端尚未接入，第一版上传后仍需手动确认公司名</Text>
            </View>
          </TouchableOpacity>
        </>
      );
    }

    if (step.key === 'company_industry') {
      return renderChips(store.options.industries, draft.company_industry.industry, value => updateStep('company_industry', { industry: value }));
    }

    if (step.key === 'company_scale') {
      return renderChips(store.options.companyScales, draft.company_scale.companyScale, value => updateStep('company_scale', { companyScale: value }));
    }

    if (step.key === 'job_name') {
      return (
        <>
          <Text style={styles.fieldLabel}>职位名称</Text>
          {renderTextInput(draft.job_name.jobName || '', '例如：AI产品经理', text => updateStep('job_name', { jobName: text }))}
          <Text style={styles.helperText}>建议使用候选人能快速理解的名称，例如 AI产品经理、AI应用工程师、大模型算法工程师。</Text>
        </>
      );
    }

    if (step.key === 'job_description') {
      return (
        <>
          {renderTextInput(draft.job_description.jobDescription || '', '描述岗位职责、任职要求和团队情况', text => updateStep('job_description', { jobDescription: text }), true)}
          <TouchableOpacity style={styles.aiButton} activeOpacity={0.86} onPress={fillAiDescription}>
            <Ionicons name="sparkles-outline" size={17} color={CommonColor.mainColor} />
            <Text style={styles.aiButtonText}>AI 生成一版职位描述</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (step.key === 'job_requirements') {
      return (
        <>
          <Text style={styles.fieldLabel}>经验要求</Text>
          {renderChips(experienceOptions.map(item => ({ label: item.label, value: item.value })), draft.job_requirements.experienceLabel, value => {
            const item = experienceOptions.find(option => option.value === value) || experienceOptions[1];
            updateStep('job_requirements', {
              experienceLabel: item.value,
              workYearRangeStart: item.start,
              workYearRangeEnd: item.end,
            });
          })}
          <Text style={styles.fieldLabel}>最低学历</Text>
          {renderChips(store.options.educations, String(draft.job_requirements.educationAttainment || ''), value => updateStep('job_requirements', { educationAttainment: value }))}
          <Text style={styles.fieldLabel}>薪资范围</Text>
          <View style={styles.salaryRow}>
            {renderPicker(toNumber(draft.job_requirements.salaryRangeStart, 10), salaryValues, value => updateStep('job_requirements', { salaryRangeStart: value }), 'K')}
            {renderPicker(toNumber(draft.job_requirements.salaryRangeEnd, 20), salaryValues, value => updateStep('job_requirements', { salaryRangeEnd: value }), 'K')}
          </View>
          <Text style={styles.fieldLabel}>职位标签</Text>
          {renderTextInput(draft.job_requirements.jobTags || '', '例如：社招,双休,AI产品', text => updateStep('job_requirements', { jobTags: text }))}
        </>
      );
    }

    if (step.key === 'job_address') {
      return (
        <>
          <Text style={styles.fieldLabel}>城市</Text>
          {renderChips(store.options.cities, draft.job_address.city, value => updateStep('job_address', { city: value }))}
          <Text style={styles.fieldLabel}>详细地址</Text>
          {renderTextInput(draft.job_address.addressDetail || '', '请输入工作地点，例如：软件园 1 号楼', text => updateStep('job_address', { addressDetail: text }))}
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={24} color={CommonColor.mainColor} />
            <Text style={styles.mapText}>地图选址后续接入，当前先保存文本地址</Text>
          </View>
        </>
      );
    }

    return (
      <View style={styles.summaryCard}>
        <SummaryRow label="公司" value={draft.company_name.companyFullName} />
        <SummaryRow label="行业" value={draft.company_industry.industry} />
        <SummaryRow label="规模" value={draft.company_scale.companyScale} />
        <SummaryRow label="职位" value={draft.job_name.jobName} />
        <SummaryRow label="经验" value={draft.job_requirements.experienceLabel} />
        <SummaryRow label="学历" value={getEducationLabel(String(draft.job_requirements.educationAttainment || '本科'))} />
        <SummaryRow label="薪资" value={`${draft.job_requirements.salaryRangeStart}-${draft.job_requirements.salaryRangeEnd}K`} />
        <SummaryRow label="地址" value={`${draft.job_address.city} ${draft.job_address.addressDetail}`} />
      </View>
    );
  };

  const buttonText = stepIndex === bossSteps.length - 1 ? '发布' : '下一步';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={CommonColor.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={[styles.header, { paddingTop: Math.max(insets.top - 38, 4) }]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={goBackStep}>
            <Ionicons name="chevron-back" size={24} color={CommonColor.fontColor} />
          </TouchableOpacity>
          <Text style={styles.brand}>AI智聘</Text>
          <Text style={styles.stepCount}>{stepIndex + 1}/{bossSteps.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{step.title}</Text>
        {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
        <View style={styles.stepBody}>{renderStepContent()}</View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={goNext} activeOpacity={saving || loading ? 1 : 0.86}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{buttonText}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value || '未填写'}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  navRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brand: {
    flex: 1,
    textAlign: 'center',
    color: CommonColor.mainColor,
    fontSize: 13,
    fontWeight: '800',
  },
  stepCount: {
    width: 44,
    textAlign: 'right',
    color: CommonColor.deepGrey,
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  title: {
    color: CommonColor.fontColor,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: CommonColor.deepGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  stepBody: {
    marginTop: 26,
  },
  loadingBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: CommonColor.fontColor,
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    marginTop: 10,
    color: CommonColor.deepGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    height: 50,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: CommonColor.line,
    color: CommonColor.fontColor,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 190,
    padding: 14,
    borderRadius: 8,
    backgroundColor: CommonColor.tagBg,
    color: CommonColor.fontColor,
    fontSize: 15,
    lineHeight: 22,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginTop: -6,
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 13,
    marginHorizontal: 5,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: CommonColor.tagBg,
  },
  chipSelected: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 13,
    marginHorizontal: 5,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: CommonColor.transparentMainColor,
    borderWidth: 1,
    borderColor: CommonColor.mainColor,
  },
  chipText: {
    color: CommonColor.deepGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: CommonColor.mainColor,
    fontSize: 13,
    fontWeight: '800',
  },
  pickerWrap: {
    flex: 1,
    height: 116,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: CommonColor.tagBg,
    overflow: 'hidden',
  },
  salaryRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  licenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    backgroundColor: CommonColor.tagBg,
  },
  licenseImage: {
    width: 78,
    height: 56,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  licenseIconWrap: {
    width: 78,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  licenseTextWrap: {
    flex: 1,
    paddingLeft: 12,
  },
  licenseTitle: {
    color: CommonColor.fontColor,
    fontSize: 14,
    fontWeight: '800',
  },
  licenseSubtitle: {
    marginTop: 5,
    color: CommonColor.deepGrey,
    fontSize: 11,
    lineHeight: 16,
  },
  aiButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: CommonColor.transparentMainColor,
    marginTop: 14,
  },
  aiButtonText: {
    marginLeft: 6,
    color: CommonColor.mainColor,
    fontSize: 13,
    fontWeight: '800',
  },
  mapPlaceholder: {
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: CommonColor.transparentMainColor,
    marginTop: 18,
  },
  mapText: {
    marginTop: 8,
    color: CommonColor.deepGrey,
    fontSize: 12,
  },
  summaryCard: {
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: CommonColor.tagBg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CommonColor.line,
  },
  summaryLabel: {
    width: 68,
    color: CommonColor.deepGrey,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: CommonColor.fontColor,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.mainColor,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
