import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonColor } from '../../../common/CommonColor';
import {
  deleteOnlineResumeSectionItem,
  loadOnlineResumeDraft,
  mergeResumeWithDraft,
  ONLINE_RESUME_SECTION_TITLES,
  OnlineResumeSection,
  updateOnlineResumeSection
} from '../../../utils/OnlineResumeDraftUtil';

type FormState = Record<string, string>;

const ACCENT_COLOR = CommonColor.mainColor;
const ACCENT_BG = CommonColor.transparentMainColor;
const PAGE_BG = '#F6F7F9';

const toStringValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const getInitialForm = (section: OnlineResumeSection, item: any): FormState => {
  if (section === 'advantage') {
    return { advantage: toStringValue(item) };
  }

  if (section === 'workExpect') {
    return {
      job: toStringValue(item?.job),
      city: toStringValue(item?.city),
      salaryRangeStart: toStringValue(item?.salaryRangeStart),
      salaryRangeEnd: toStringValue(item?.salaryRangeEnd),
      industryArr: Array.isArray(item?.industryArr) ? item.industryArr.join('、') : toStringValue(item?.industryArr),
    };
  }

  if (section === 'workExperience') {
    return {
      companyFullName: toStringValue(item?.companyFullName),
      industry: toStringValue(item?.industry),
      jobName: toStringValue(item?.jobName),
      workDateStart: toStringValue(item?.workDateStart),
      workDateEnd: toStringValue(item?.workDateEnd),
      workDetail: toStringValue(item?.workDetail),
    };
  }

  if (section === 'projectExperience') {
    return {
      projectName: toStringValue(item?.projectName),
      projectRole: toStringValue(item?.projectRole),
      projectDateStart: toStringValue(item?.projectDateStart),
      projectDateEnd: toStringValue(item?.projectDateEnd),
      projectResult: toStringValue(item?.projectResult),
      projectLink: toStringValue(item?.projectLink),
    };
  }

  return {
    schoolName: toStringValue(item?.schoolName),
    educationAttainment: toStringValue(item?.educationAttainment),
    major: toStringValue(item?.major),
    yearStart: toStringValue(item?.yearStart),
    yearEnd: toStringValue(item?.yearEnd),
    schoolExp: toStringValue(item?.schoolExp),
    paper: toStringValue(item?.paper),
  };
};

const inputRows: Record<OnlineResumeSection, { key: string; label: string; placeholder: string; multiline?: boolean; keyboardType?: 'numeric' }[]> = {
  advantage: [
    { key: 'advantage', label: '个人优势', placeholder: '例如：3 年 React Native 经验，熟悉移动端性能优化...', multiline: true },
  ],
  workExpect: [
    { key: 'job', label: '期望职位', placeholder: '例如：React Native 开发工程师' },
    { key: 'city', label: '期望城市', placeholder: '例如：深圳' },
    { key: 'salaryRangeStart', label: '最低薪资 K', placeholder: '例如：15', keyboardType: 'numeric' },
    { key: 'salaryRangeEnd', label: '最高薪资 K', placeholder: '例如：25', keyboardType: 'numeric' },
    { key: 'industryArr', label: '期望行业', placeholder: '多个行业用顿号或逗号分隔' },
  ],
  workExperience: [
    { key: 'companyFullName', label: '公司名称', placeholder: '例如：某某科技有限公司' },
    { key: 'industry', label: '所属行业', placeholder: '例如：互联网' },
    { key: 'jobName', label: '职位名称', placeholder: '例如：前端开发工程师' },
    { key: 'workDateStart', label: '开始时间', placeholder: '例如：2022-03' },
    { key: 'workDateEnd', label: '结束时间', placeholder: '例如：2025-06' },
    { key: 'workDetail', label: '工作内容', placeholder: '描述你的职责、成果和技术栈', multiline: true },
  ],
  projectExperience: [
    { key: 'projectName', label: '项目名称', placeholder: '例如：招聘 App 重构' },
    { key: 'projectRole', label: '项目角色', placeholder: '例如：前端负责人' },
    { key: 'projectDateStart', label: '开始时间', placeholder: '例如：2024-01' },
    { key: 'projectDateEnd', label: '结束时间', placeholder: '例如：2024-08' },
    { key: 'projectResult', label: '项目成果', placeholder: '描述项目背景、职责、结果', multiline: true },
    { key: 'projectLink', label: '项目链接', placeholder: '可选' },
  ],
  eduExperience: [
    { key: 'schoolName', label: '学校名称', placeholder: '例如：厦门大学' },
    { key: 'educationAttainment', label: '学历', placeholder: '例如：本科' },
    { key: 'major', label: '专业', placeholder: '例如：软件工程' },
    { key: 'yearStart', label: '入学年份', placeholder: '例如：2018', keyboardType: 'numeric' },
    { key: 'yearEnd', label: '毕业年份', placeholder: '例如：2022', keyboardType: 'numeric' },
    { key: 'schoolExp', label: '在校经历', placeholder: '社团、竞赛、奖项等', multiline: true },
    { key: 'paper', label: '毕设/论文', placeholder: '可选', multiline: true },
  ],
};

export default () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const section = params?.section as OnlineResumeSection;
  const index = typeof params?.index === 'number' ? params.index : undefined;
  const isEditingItem = typeof index === 'number' && index >= 0;
  const [resume, setResume] = useState<Partial<ResumeData>>(params?.resume || {});
  const [form, setForm] = useState<FormState>(() => getInitialForm(section, params?.item));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOnlineResumeDraft().then(draft => {
      setResume(mergeResumeWithDraft(params?.resume || {}, draft));
    });
  }, []);

  const setFieldValue = (key: string, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const requireFields = (fields: string[]) => {
    const missingField = fields.find(field => !form[field]?.trim());
    return missingField === undefined;
  };

  const buildValue = () => {
    if (section === 'advantage') {
      return form.advantage.trim();
    }

    if (section === 'workExpect') {
      return {
        type: 1,
        city: form.city.trim(),
        job: form.job.trim(),
        salaryRangeStart: Number(form.salaryRangeStart) || 0,
        salaryRangeEnd: Number(form.salaryRangeEnd) || 0,
        industryArr: form.industryArr
          .split(/[、,，]/)
          .map(item => item.trim())
          .filter(Boolean),
      } as WorkExpectDto;
    }

    if (section === 'workExperience') {
      return {
        companyFullName: form.companyFullName.trim(),
        industry: form.industry.trim(),
        workDateStart: form.workDateStart.trim(),
        workDateEnd: form.workDateEnd.trim(),
        jobName: form.jobName.trim(),
        workDetail: form.workDetail.trim(),
      } as WorkExperienceDto;
    }

    if (section === 'projectExperience') {
      return {
        projectName: form.projectName.trim(),
        projectRole: form.projectRole.trim(),
        projectDateStart: form.projectDateStart.trim(),
        projectDateEnd: form.projectDateEnd.trim(),
        projectResult: form.projectResult.trim(),
        projectLink: form.projectLink.trim(),
      } as ProjectExperienceDto;
    }

    return {
      schoolName: form.schoolName.trim(),
      educationAttainment: form.educationAttainment.trim(),
      major: form.major.trim(),
      yearStart: Number(form.yearStart) || 0,
      yearEnd: Number(form.yearEnd) || 0,
      schoolExp: form.schoolExp.trim(),
      paper: form.paper.trim(),
    } as EduExperienceDto;
  };

  const validate = () => {
    if (section === 'advantage') {
      return requireFields(['advantage']);
    }
    if (section === 'workExpect') {
      return requireFields(['job', 'city', 'salaryRangeStart', 'salaryRangeEnd']);
    }
    if (section === 'workExperience') {
      return requireFields(['companyFullName', 'jobName', 'workDateStart', 'workDateEnd', 'workDetail']);
    }
    if (section === 'projectExperience') {
      return requireFields(['projectName', 'projectRole', 'projectDateStart', 'projectDateEnd', 'projectResult']);
    }
    return requireFields(['schoolName', 'educationAttainment', 'major', 'yearStart', 'yearEnd']);
  };

  const onSave = async () => {
    if (saving) {
      return;
    }

    if (!section || !ONLINE_RESUME_SECTION_TITLES[section]) {
      Alert.alert('保存失败', '未知的简历模块');
      return;
    }

    if (!validate()) {
      Alert.alert('请完善必填内容');
      return;
    }

    setSaving(true);
    await updateOnlineResumeSection(resume, section, buildValue(), index);
    setSaving(false);
    Alert.alert('已保存', '当前内容已保存到本机，后端接口完成后可切换为云端保存。', [
      { text: '确定', onPress: () => navigation.goBack() },
    ]);
  };

  const onDelete = () => {
    if (!isEditingItem || !section || section === 'advantage') {
      return;
    }

    Alert.alert('删除这条内容？', '删除后会从本机草稿中移除。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteOnlineResumeSectionItem(resume, section, index);
          navigation.goBack();
        },
      },
    ]);
  };

  const title = `${isEditingItem || section === 'advantage' ? '编辑' : '新增'}${ONLINE_RESUME_SECTION_TITLES[section] || '在线简历'}`;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={CommonColor.fontColor} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 96 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="document-text-outline" size={22} color={ACCENT_COLOR} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{ONLINE_RESUME_SECTION_TITLES[section] || '在线简历'}</Text>
            <Text style={styles.tipText}>内容会先保存到本机草稿，后端保存接口完成后可同步到云端。</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {(inputRows[section] || []).map((row, index, rows) => (
            <View
              key={row.key}
              style={[
                styles.formItem,
                index === 0 ? styles.firstFormItem : null,
                index === rows.length - 1 ? styles.lastFormItem : null,
              ]}
            >
              <Text style={styles.label}>{row.label}</Text>
              <TextInput
                style={[styles.input, row.multiline ? styles.multilineInput : null]}
                value={form[row.key] || ''}
                onChangeText={text => setFieldValue(row.key, text)}
                placeholder={row.placeholder}
                placeholderTextColor={CommonColor.normalGrey}
                multiline={row.multiline}
                keyboardType={row.keyboardType === 'numeric' ? 'numeric' : 'default'}
                textAlignVertical={row.multiline ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>

        {isEditingItem && section !== 'advantage' ? (
          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.86} onPress={onDelete}>
            <Text style={styles.deleteText}>删除这条内容</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity onPress={onSave} style={styles.primaryButton} activeOpacity={saving ? 1 : 0.86}>
          <Text style={styles.primaryButtonText}>{saving ? '保存中' : '保存草稿'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF3',
  },
  iconButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#222222',
    fontSize: 17,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_BG,
  },
  tipContent: {
    flex: 1,
    paddingLeft: 12,
  },
  tipTitle: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '800',
  },
  tipText: {
    marginTop: 4,
    color: CommonColor.deepGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  formItem: {
    paddingTop: 17,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF3',
  },
  firstFormItem: {
    paddingTop: 18,
  },
  lastFormItem: {
    borderBottomWidth: 0,
  },
  label: {
    color: '#222222',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 32,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: '#222222',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  multilineInput: {
    minHeight: 116,
    paddingTop: 0,
    lineHeight: 22,
  },
  deleteButton: {
    marginTop: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#fff1f1',
  },
  deleteText: {
    color: '#d33',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEFF3',
  },
  primaryButton: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
