import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonColor } from '../../../common/CommonColor';
import BossStore from '../../../stores/BossStore';
import type { CompanyInfo } from '../../../utils/CompanyInfoUtil';
import { REQUIRED_COMPANY_FIELDS, toCompanyText } from '../../../utils/CompanyInfoUtil';

type CompanyFormState = {
  companyFullName: string;
  companyAbbrName: string;
  companyLogo: string;
  companyDescription: string;
  companyScale: string;
  financingStage: string;
  industry: string;
  restWay: string;
  overtime: string;
  photo: string;
  employeeWelfare: string;
  mainBusiness: string;
  country: string;
  province: string;
  city: string;
  district: string;
  addressDetail: string;
  longitude: string;
  latitude: string;
  businessLicense: string;
};

type CompanyFormField = {
  key: keyof CompanyFormState;
  label: string;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const fieldGroups: Array<{ title: string; fields: CompanyFormField[] }> = [
  {
    title: '基础信息',
    fields: [
      { key: 'companyFullName', label: '公司全称', placeholder: '例如：长沙智聘科技有限公司', required: true },
      { key: 'companyAbbrName', label: '公司简称', placeholder: '例如：AI智聘', required: true },
      { key: 'industry', label: '所属行业', placeholder: '例如：人工智能 / 企业服务', required: true },
      { key: 'companyScale', label: '公司规模', placeholder: '例如：20-99人', required: true },
      { key: 'financingStage', label: '融资阶段', placeholder: '例如：不需要融资 / 天使轮', required: true },
    ],
  },
  {
    title: '地址信息',
    fields: [
      { key: 'country', label: '国家', placeholder: '中国' },
      { key: 'province', label: '省份', placeholder: '例如：湖南省' },
      { key: 'city', label: '城市', placeholder: '例如：长沙', required: true },
      { key: 'district', label: '区域', placeholder: '例如：岳麓区', required: true },
      { key: 'addressDetail', label: '详细地址', placeholder: '例如：麓谷企业广场 1 栋', required: true },
    ],
  },
  {
    title: '公司展示',
    fields: [
      { key: 'companyDescription', label: '公司介绍', placeholder: '介绍公司定位、团队背景、业务方向', required: true, multiline: true },
      { key: 'mainBusiness', label: '主营业务', placeholder: '例如：AI招聘平台、企业智能筛选工具', required: true, multiline: true },
      { key: 'employeeWelfare', label: '员工福利', placeholder: '多个福利用顿号分隔，例如：双休、五险一金、年终奖' },
      { key: 'companyLogo', label: '公司 Logo', placeholder: 'Logo 图片 URL' },
      { key: 'photo', label: '公司照片', placeholder: '公司环境图片 URL' },
    ],
  },
  {
    title: '补充信息',
    fields: [
      { key: 'restWay', label: '休息制度编号', placeholder: '可选', keyboardType: 'numeric' },
      { key: 'overtime', label: '加班情况编号', placeholder: '可选', keyboardType: 'numeric' },
      { key: 'longitude', label: '经度', placeholder: '可选', keyboardType: 'numeric' },
      { key: 'latitude', label: '纬度', placeholder: '可选', keyboardType: 'numeric' },
      { key: 'businessLicense', label: '营业执照', placeholder: '营业执照图片 URL' },
    ],
  },
];

const buildInitialForm = (companyInfo?: CompanyInfo | null): CompanyFormState => {
  const company = companyInfo || {};

  return {
    companyFullName: toCompanyText(company.companyFullName),
    companyAbbrName: toCompanyText(company.companyAbbrName),
    companyLogo: toCompanyText(company.companyLogo),
    companyDescription: toCompanyText(company.companyDescription),
    companyScale: toCompanyText(company.companyScale),
    financingStage: toCompanyText(company.financingStage),
    industry: toCompanyText(company.industry),
    restWay: toCompanyText(company.restWay),
    overtime: toCompanyText(company.overtime),
    photo: toCompanyText(company.photo),
    employeeWelfare: toCompanyText(company.employeeWelfare),
    mainBusiness: toCompanyText(company.mainBusiness),
    country: toCompanyText(company.country) || '中国',
    province: toCompanyText(company.province),
    city: toCompanyText(company.city),
    district: toCompanyText(company.district),
    addressDetail: toCompanyText(company.addressDetail),
    longitude: toCompanyText(company.longitude),
    latitude: toCompanyText(company.latitude),
    businessLicense: toCompanyText(company.businessLicense),
  };
};

const optionalNumber = (value: string): number | undefined => {
  const text = value.trim();
  if (!text) {
    return undefined;
  }

  const numberValue = Number(text);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const compactPayload = (payload: Record<string, string | number | undefined>) => {
  const result: Record<string, string | number> = {};

  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length === 0) {
      return;
    }

    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
};

const toJsonTextList = (value: string): string | undefined => {
  const text = value.trim();
  if (!text) {
    return undefined;
  }

  try {
    JSON.parse(text);
    return text;
  } catch (error) {
    const list = text
      .split(/[,\s，、]+/)
      .map(item => item.trim())
      .filter(Boolean);
    return JSON.stringify(list.length ? list : [text]);
  }
};

export default observer(() => {
  const store = useLocalStore(() => new BossStore());
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const paramsCompanyInfo = params?.companyInfo as CompanyInfo | undefined;
  const nextPage = params?.next as string | undefined;

  const [form, setForm] = useState<CompanyFormState>(() => buildInitialForm(paramsCompanyInfo));
  const [loading, setLoading] = useState(!paramsCompanyInfo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (paramsCompanyInfo) {
      return;
    }

    let active = true;
    setLoading(true);

    store.requestMyCompany()
      .then(res => {
        if (!active) {
          return;
        }

        if (res?.code === 0) {
          setForm(buildInitialForm(res.data || {}));
        } else {
          Alert.alert('加载失败', res?.message || '企业资料暂时无法加载');
        }
      })
      .catch((error: any) => {
        if (active) {
          Alert.alert('加载失败', error?.response?.data?.message || error?.message || '网络异常，请稍后重试');
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

  const setFieldValue = (key: keyof CompanyFormState, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const validateRequiredFields = () => {
    const missingField = REQUIRED_COMPANY_FIELDS.find(field => {
      const key = field.key as keyof CompanyFormState;
      return !form[key]?.trim();
    });

    if (missingField) {
      Alert.alert('请完善企业资料', `请填写${missingField.label}`);
      return false;
    }

    return true;
  };

  const validateOptionalNumbers = () => {
    const invalidField = fieldGroups
      .flatMap(group => group.fields)
      .find(field => field.keyboardType === 'numeric' && form[field.key].trim() && optionalNumber(form[field.key]) === undefined);

    if (invalidField) {
      Alert.alert('格式不正确', `${invalidField.label}需要填写数字`);
      return false;
    }

    return true;
  };

  const buildPayload = () => compactPayload({
    companyFullName: form.companyFullName.trim(),
    companyAbbrName: form.companyAbbrName.trim(),
    companyLogo: form.companyLogo.trim(),
    companyDescription: form.companyDescription.trim(),
    companyScale: form.companyScale.trim(),
    financingStage: form.financingStage.trim(),
    industry: form.industry.trim(),
    restWay: optionalNumber(form.restWay),
    overtime: optionalNumber(form.overtime),
    photo: toJsonTextList(form.photo),
    employeeWelfare: toJsonTextList(form.employeeWelfare),
    mainBusiness: toJsonTextList(form.mainBusiness),
    country: form.country.trim(),
    province: form.province.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    addressDetail: form.addressDetail.trim(),
    longitude: optionalNumber(form.longitude),
    latitude: optionalNumber(form.latitude),
  });

  const goNext = () => {
    if (nextPage) {
      navigation.replace(nextPage);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('ToutouTabPage');
  };

  const onSave = async () => {
    if (loading || saving) {
      return;
    }

    if (!validateRequiredFields() || !validateOptionalNumbers()) {
      return;
    }

    setSaving(true);
    try {
      const companyRes = await store.saveMyCompany(buildPayload());
      if (companyRes?.code !== 0) {
        Alert.alert('保存失败', companyRes?.message || '企业资料保存失败，请稍后再试');
        return;
      }

      const businessLicense = form.businessLicense.trim();
      if (businessLicense) {
        const licenseRes = await store.submitToutouLicense(businessLicense);
        if (licenseRes?.code !== 0) {
          Alert.alert('营业执照提交失败', licenseRes?.message || '企业资料已保存，营业执照可稍后重试');
          return;
        }
      }

      Alert.alert('已保存', '企业资料已更新', [
        { text: '确定', onPress: goNext },
      ]);
    } catch (error: any) {
      Alert.alert('保存失败', error?.response?.data?.message || error?.message || '网络异常，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: CompanyFormField, isLast: boolean) => (
    <View key={field.key} style={[styles.formItem, isLast ? styles.lastFormItem : null]}>
      <Text style={styles.label}>
        {field.label}
        {field.required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, field.multiline ? styles.multilineInput : null]}
        value={form[field.key]}
        onChangeText={text => setFieldValue(field.key, text)}
        placeholder={field.placeholder}
        placeholderTextColor={CommonColor.normalGrey}
        multiline={field.multiline}
        keyboardType={field.keyboardType || 'default'}
        textAlignVertical={field.multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={CommonColor.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.72}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace('ToutouTabPage');
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color={CommonColor.fontColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>企业资料</Text>
          <View style={styles.headerButton} />
        </View>
        <Text style={styles.headerSubtitle}>完善后展示在职位详情和招聘方主页</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={CommonColor.mainColor} />
        </View>
      ) : (
        <ScrollView
          style={styles.form}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 96 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {fieldGroups.map(group => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.formCard}>
                {group.fields.map((field, index) => renderField(field, index === group.fields.length - 1))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.primaryButton, loading ? styles.primaryButtonDisabled : null]}
          activeOpacity={loading || saving ? 1 : 0.86}
          onPress={onSave}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>{loading ? '加载中' : '保存企业资料'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CommonColor.normalBg,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.78)',
  },
  headerRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: CommonColor.fontColor,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginLeft: 12,
    marginRight: 12,
    marginTop: 2,
    color: CommonColor.deepGrey,
    fontSize: 12,
    lineHeight: 18,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    marginBottom: 8,
    marginLeft: 4,
    color: CommonColor.deepGrey,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  formItem: {
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CommonColor.line,
  },
  lastFormItem: {
    borderBottomWidth: 0,
  },
  label: {
    marginBottom: 8,
    color: CommonColor.fontColor,
    fontSize: 14,
    fontWeight: '700',
  },
  required: {
    color: '#d84b4b',
  },
  input: {
    minHeight: 32,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: CommonColor.fontColor,
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  multilineInput: {
    minHeight: 104,
    paddingTop: 0,
    lineHeight: 22,
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
    borderTopColor: CommonColor.line,
  },
  primaryButton: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.mainColor,
  },
  primaryButtonDisabled: {
    backgroundColor: CommonColor.normalGrey,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
