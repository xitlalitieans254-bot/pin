import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonColor } from '../../common/CommonColor';
import OnboardingStore, { OnboardingRole } from '../../stores/OnboardingStore';
import { requestAndNavigateByOnboarding } from '../../utils/OnboardingNavigationUtil';
import roleJobseeker from '../../assets/onboarding/role_jobseeker.png';
import roleBoss from '../../assets/onboarding/role_boss.png';

const roleCards: Array<{
  role: OnboardingRole;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
}> = [
  {
    role: 'JOBSEEKER',
    title: '我要找工作',
    subtitle: '完善资料，开始发现 AI 岗位',
    image: roleJobseeker,
  },
  {
    role: 'BOSS',
    title: '我要招人',
    subtitle: '创建公司资料，发布招聘需求',
    image: roleBoss,
  },
];

export default () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [submittingRole, setSubmittingRole] = useState<OnboardingRole | ''>('');

  const selectRole = async (role: OnboardingRole) => {
    if (submittingRole) {
      return;
    }

    setSubmittingRole(role);
    try {
      const store = new OnboardingStore();
      const res = await store.selectRole(role);
      if (res?.code !== 0) {
        Alert.alert('选择失败', res?.message || '暂时无法选择身份，请稍后再试');
        return;
      }

      await requestAndNavigateByOnboarding(navigation, 'LoginPage');
    } catch (error: any) {
      Alert.alert('选择失败', error?.response?.data?.message || error?.message || '网络异常，请稍后再试');
    } finally {
      setSubmittingRole('');
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top - 38, 4) }]}>
        <Text style={styles.brand}>AI智聘</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>请选择你的身份</Text>
        <Text style={styles.subtitle}>根据你的目标，为你准备不同的开始流程</Text>

        {roleCards.map((card, index) => (
          <React.Fragment key={card.role}>
            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.roleCard}
              onPress={() => selectRole(card.role)}
            >
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>{card.title}</Text>
                <Text style={styles.roleSubtitle}>{card.subtitle}</Text>
              </View>
              <View style={styles.roleImageWrap}>
                <Image source={card.image} style={styles.roleImage} resizeMode="contain" />
                {submittingRole === card.role ? (
                  <View style={styles.roleLoadingMask}>
                    <ActivityIndicator color={CommonColor.mainColor} />
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>

            {index === 0 ? (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>或者</Text>
                <View style={styles.dividerLine} />
              </View>
            ) : null}
          </React.Fragment>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.logoutButton, { bottom: insets.bottom + 18 }]}
        onPress={() => navigation.replace('LoginPage')}
      >
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: 36,
    justifyContent: 'center',
  },
  brand: {
    textAlign: 'center',
    color: CommonColor.mainColor,
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 118,
  },
  title: {
    color: CommonColor.fontColor,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 34,
    color: CommonColor.deepGrey,
    fontSize: 15,
    lineHeight: 22,
  },
  roleCard: {
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E4E8EE',
  },
  roleTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  roleTitle: {
    color: CommonColor.fontColor,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  roleSubtitle: {
    marginTop: 8,
    color: CommonColor.deepGrey,
    fontSize: 14,
    lineHeight: 20,
  },
  roleImageWrap: {
    width: 132,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roleImage: {
    width: 132,
    height: 96,
  },
  roleLoadingMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: CommonColor.line,
  },
  dividerText: {
    marginHorizontal: 16,
    color: CommonColor.normalGrey,
    fontSize: 15,
  },
  logoutButton: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  logoutText: {
    color: CommonColor.normalGrey,
    fontSize: 13,
  },
});
