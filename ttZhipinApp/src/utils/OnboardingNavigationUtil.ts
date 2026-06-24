import { StackNavigationProp } from '@react-navigation/stack';
import OnboardingStore, { OnboardingStatus } from '../stores/OnboardingStore';

export const getOnboardingRouteName = (nextPage?: string): string => {
  if (nextPage === 'ROLE_SELECT') {
    return 'OnboardingRolePage';
  }

  if (nextPage === 'JOBSEEKER_ONBOARDING') {
    return 'JobseekerOnboardingPage';
  }

  if (nextPage === 'BOSS_ONBOARDING') {
    return 'BossOnboardingPage';
  }

  if (nextPage === 'BOSS_HOME') {
    return 'ToutouTabPage';
  }

  return 'TabPage';
};

export const navigateByOnboardingStatus = (
  navigation: StackNavigationProp<any>,
  status?: OnboardingStatus,
) => {
  const nextPage = status?.nextPage || 'ROLE_SELECT';
  const routeName = getOnboardingRouteName(nextPage);

  navigation.replace(routeName, { onboardingStatus: status || {} });
};

export const requestAndNavigateByOnboarding = async (
  navigation: StackNavigationProp<any>,
  fallbackRouteName: string = 'LoginPage',
) => {
  try {
    const store = new OnboardingStore();
    const res = await store.requestStatus();

    if (res?.code !== 0) {
      navigation.replace(fallbackRouteName);
      return;
    }

    navigateByOnboardingStatus(navigation, res.data || {});
  } catch (error) {
    navigation.replace(fallbackRouteName);
  }
};
