import { Alert, Dimensions, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalStore, observer } from 'mobx-react';
import Icon from 'react-native-vector-icons/Ionicons';
import FlowList from '../../../components/flowlist/FlowList.js';
import { CommonColor } from '../../../common/CommonColor';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ToutouWorkerStore from '../../../stores/ToutouWorkerStore';
import DateUtil from '../../../utils/DateUtil';
import { getChineseEducation, getEducationType, getJobStatus } from '../../../common/NormalEnum';
import ApiService from '../../../apis/ApiService';
import GradientHeader from '../../worker/components/GradientHeader';
import TitleBar from '../../worker/job/components/TitleBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 12;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const DEFAULT_CHAT_AVATAR = 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png';

const safeParseJson = <T,>(text: unknown, fallback: T): T => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return fallback;
  }
};

const compactText = (parts: Array<string | number | undefined | null>) => (
  parts
    .map(item => (item === undefined || item === null ? '' : String(item).trim()))
    .filter(Boolean)
    .join(' · ')
);

const getWorkerFallbackName = (worker: BossMemberEntity) => {
  const name = String(worker.fullName || '').trim();
  return name || `用户${String(worker.id).slice(-4)}`;
};

const formatCity = (city?: string) => {
  const text = String(city || '').trim();
  return text.replace(/^中国/, '') || '城市待完善';
};

const formatWorkYears = (workDate?: string) => {
  if (!workDate) {
    return '';
  }

  const date = new Date(workDate.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  if (now.getMonth() < date.getMonth()) {
    years -= 1;
  }

  if (years <= 0) {
    return '1年以内经验';
  }

  return `${years}年经验`;
};

const buildTags = (worker: BossMemberEntity) => {
  const workYears = formatWorkYears(worker.workDate);
  const education = getChineseEducation(worker.highestQualification);
  const educationType = getEducationType(worker.highestQualificationType);
  const status = getJobStatus(worker.workStatus);

  return [workYears, education, educationType, status].filter(Boolean).slice(0, 4);
};

const buildMeta = (worker: BossMemberEntity) => {
  const age = DateUtil.calculateAge(worker.birthday);
  return compactText([
    age ? `${age}岁` : '',
    getChineseEducation(worker.highestQualification),
    formatCity(worker.city),
  ]) || '基础资料待完善';
};

const buildSummary = (worker: BossMemberEntity) => {
  const status = getJobStatus(worker.workStatus);
  const education = getChineseEducation(worker.highestQualification);
  const workYears = formatWorkYears(worker.workDate);

  if (Number(worker.identityStatus) !== 1) {
    return '资料还在完善中，可以先发起沟通了解求职意向。';
  }

  return compactText([status, workYears, education])
    || '已创建在线简历，可进一步沟通岗位匹配度。';
};

export default observer(() => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const store = useLocalStore(() => new ToutouWorkerStore());
  const [index, setIndex] = useState<number>(0);
  const [openingChatId, setOpeningChatId] = useState<string>('');

  useEffect(() => {
    store.requestLatestTest(true);
  }, []);

  const refreshList = () => {
    store.requestLatestTest(true);
  };

  const loadData = () => {
    store.requestLatestTest(false);
  };

  const openPrivateChat = async (worker: BossMemberEntity) => {
    const toMemberId = String(worker.id || '');
    if (!toMemberId || openingChatId === toMemberId) {
      return;
    }

    try {
      setOpeningChatId(toMemberId);
      const { data } = await ApiService.request('ensurePrivateTalk', { toMemberId });
      if (data?.code !== 0) {
        Alert.alert('无法发起沟通', data?.message || data?.msg || '请稍后再试');
        return;
      }

      const talk = data?.data || {};
      const ensuredInfo = safeParseJson<Record<string, any>>(talk.fromMemberInfo, {});
      const fallbackName = getWorkerFallbackName(worker);

      navigation.push('ChatPage', {
        memberId: String(talk.fromMemberId || toMemberId),
        fromMemberId: String(talk.fromMemberId || ''),
        toMemberId: String(talk.toMemberId || ''),
        avatar: String(ensuredInfo.avatar || worker.avatar || DEFAULT_CHAT_AVATAR),
        name: String(ensuredInfo.name || fallbackName),
        jobTitle: String(ensuredInfo.jobTitle || getJobStatus(worker.workStatus) || '求职者'),
        companyAbbrName: String(ensuredInfo.companyAbbrName || ''),
      });
    } catch (error) {
      Alert.alert('无法发起沟通', (error as any)?.message || '网络异常，请稍后再试');
    } finally {
      setOpeningChatId('');
    }
  };

  const renderFooter = () => {
    if (!store.jobList.length) {
      return null;
    }

    return <Text style={styles.footerText}>已经滑到底部了</Text>;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Icon name="people-outline" size={42} color={CommonColor.normalGrey} />
      <Text style={styles.emptyTitle}>暂无牛人</Text>
      <Text style={styles.emptySubtitle}>完善职位后，系统会为你推荐更匹配的人才</Text>
    </View>
  );

  const renderTalentCard = ({ item }: { item: BossMemberEntity; index: number }) => {
    const name = getWorkerFallbackName(item);
    const avatarUrl = String(item.avatar || '').trim();
    const tags = buildTags(item);
    const completed = Number(item.identityStatus) === 1;
    const statusText = completed ? '在线简历' : '待完善';
    const statusStyle = completed ? styles.statusReady : styles.statusPending;
    const statusTextStyle = completed ? styles.statusReadyText : styles.statusPendingText;

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.card}
        onPress={() => openPrivateChat(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image style={styles.avatar} source={{ uri: avatarUrl }} />
            ) : (
              <View style={styles.avatarFallback}>
                <Icon name="person-outline" size={21} color={CommonColor.mainColor} />
              </View>
            )}
          </View>

          <View style={styles.titleWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <View style={statusStyle}>
                <Text style={statusTextStyle}>{statusText}</Text>
              </View>
            </View>
            <Text style={styles.meta} numberOfLines={1}>{buildMeta(item)}</Text>
          </View>
        </View>

        <View style={styles.tagRow}>
          {tags.length > 0 ? tags.map((tag, tagIndex) => (
            <View key={`${item.id}_${tag}_${tagIndex}`} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
            </View>
          )) : (
            <View style={styles.tag}>
              <Text style={styles.tagText}>资料待完善</Text>
            </View>
          )}
        </View>

        <Text style={styles.summary} numberOfLines={2}>{buildSummary(item)}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.locationWrap}>
            <Icon name="location-outline" size={14} color={CommonColor.normalGrey} />
            <Text style={styles.locationText} numberOfLines={1}>{formatCity(item.city)}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.chatButton}
            onPress={() => openPrivateChat(item)}
          >
            <Text style={styles.chatButtonText}>{openingChatId === String(item.id) ? '打开中' : '沟通'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleTabChanged = (tab: number) => {
    setIndex(tab);
    store.requestLatestTest(true);
  };

  return (
    <View style={styles.root}>
      <GradientHeader
        title="AI牛人"
        actions={[
          { icon: 'add-outline', onPress: () => navigation.push('BossJobListPage') },
          { icon: 'search-outline' },
        ]}
      >
        <TitleBar
          tab={index}
          city="长沙"
          onAddButtonPress={() => {}}
          onTabChanged={handleTabChanged}
        />
      </GradientHeader>

      <FlowList
        keyExtractor={(item: BossMemberEntity) => `${item.id}`}
        contentContainerStyle={store.jobList.length ? styles.listContainer : styles.emptyContainer}
        style={styles.flatList}
        data={store.jobList}
        extraData={[store.refreshing, openingChatId]}
        renderItem={renderTalentCard}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={store.refreshing}
            tintColor={CommonColor.mainColor}
            onRefresh={refreshList}
          />
        }
        refreshing={store.refreshing}
        onRefresh={refreshList}
        onEndReachedThreshold={0.2}
        onEndReached={loadData}
        ListEmptyComponent={!store.refreshing ? renderEmpty : null}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CommonColor.zhipinBg,
  },

  flatList: {
    flex: 1,
    width: '100%',
    backgroundColor: CommonColor.zhipinBg,
  },

  listContainer: {
    paddingTop: 9,
    paddingBottom: 14,
  },

  emptyContainer: {
    flexGrow: 1,
    paddingTop: 9,
    paddingBottom: 14,
  },

  card: {
    width: CARD_WIDTH,
    minHeight: 156,
    backgroundColor: '#ffffff',
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 14,
    shadowColor: '#34356a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(91, 95, 244, 0.06)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    width: 44,
    height: 44,
    marginRight: 11,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
    backgroundColor: '#eef2ff',
  },

  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.transparentMainColor,
  },

  titleWrap: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  name: {
    flexShrink: 1,
    color: '#10131a',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    paddingRight: 8,
  },

  statusReady: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.transparentMainColor,
  },

  statusPending: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CommonColor.greyButtonBg,
  },

  statusReadyText: {
    color: CommonColor.mainColor,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },

  statusPendingText: {
    color: CommonColor.normalGrey,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },

  meta: {
    marginTop: 3,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 18,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: -6,
  },

  tag: {
    maxWidth: CARD_WIDTH - 42,
    backgroundColor: CommonColor.tagBg,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },

  tagText: {
    color: '#5d6372',
    fontSize: 12,
    lineHeight: 15,
  },

  summary: {
    marginTop: 13,
    color: '#252936',
    fontSize: 13,
    lineHeight: 19,
  },

  bottomRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },

  locationText: {
    color: CommonColor.normalGrey,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 4,
  },

  chatButton: {
    height: 30,
    minWidth: 62,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    backgroundColor: CommonColor.mainColor,
  },

  chatButtonText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyTitle: {
    marginTop: 12,
    color: CommonColor.fontColor,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },

  emptySubtitle: {
    marginTop: 6,
    color: CommonColor.normalGrey,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  footerText: {
    textAlign: 'center',
    color: '#999999',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 24,
    fontSize: 12,
  },
});
