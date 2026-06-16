import React, { useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import FlowList from '../../../components/flowlist/FlowList.js';
import { CommonColor } from '../../../common/CommonColor';
import HomeStore from '../../../stores/HomeStore';
import GradientHeader from '../components/GradientHeader';
import TitleBar from './components/TitleBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 12;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
type JobListType = 'recommend' | 'nearby' | 'latest';
const JOB_LIST_TYPES: JobListType[] = ['recommend', 'nearby', 'latest'];

type RecruiterInfo = {
  avatar?: string;
  name?: string;
  fullName?: string;
  jobTitle?: string;
};

const parseJson = <T,>(value: any, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const formatSalary = (item: JobEntity) => {
  const start = Math.floor((item.salaryRangeStart || 0) / 1000);
  const end = Math.floor((item.salaryRangeEnd || 0) / 1000);
  const baseSalary = start && end ? `${start}-${end}K` : '薪资面议';
  const payDay = item.salaryOptional?.payDay ? String(item.salaryOptional.payDay) : '';
  const payDayText = payDay.includes('薪') ? payDay : `${payDay}薪`;

  return payDay ? `${baseSalary}·${payDayText}` : baseSalary;
};

const formatWorkYear = (item: JobEntity) => {
  const start = item.workYearRangeStart;
  const end = item.workYearRangeEnd;

  if (!start && !end) {
    return '经验不限';
  }

  if (start && end) {
    return `${start}-${end}年`;
  }

  if (start) {
    return `${start}年以上`;
  }

  return `${end}年以内`;
};

const buildTags = (item: JobEntity) => {
  const tags = parseJson<string[]>(item.jobTags, []);
  return [formatWorkYear(item), item.educationAttainment, ...tags]
    .filter(Boolean)
    .slice(0, 4);
};

const buildCompanyInfo = (item: JobEntity) => {
  return [
    item.companyResponse?.companyAbbrName,
    item.companyResponse?.financingStage,
    item.companyResponse?.companyScale,
  ].filter(Boolean).join(' ');
};

const buildReplyText = (replyCount?: number) => {
  if (!replyCount) {
    return '刚刚活跃';
  }

  if (replyCount >= 10) {
    return '今日回复10+次';
  }

  return `今日回复${replyCount}次`;
};

const buildAddressText = (item: JobEntity) => {
  return [item.district, item.addressDetail].filter(Boolean).join(' ');
};

export default observer(() => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const store = useLocalStore(() => new HomeStore());
  const [index, setIndex] = useState<number>(0);
  const currentListType = JOB_LIST_TYPES[index] || 'recommend';

  useEffect(() => {
    store.requestJobList('recommend', true);
  }, []);

  const onJobRefresh = () => {
    store.requestJobList(currentListType, true);
  };

  const loadData = () => {
    store.requestJobList(currentListType);
  };

  const renderFooter = () => {
    if (!store.jobList.length) {
      return null;
    }

    return <Text style={styles.footerText}>已经滑到底部了</Text>;
  };

  const renderEmpty = () => {
    if (store.refreshing) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{store.errorMessage || '暂无职位'}</Text>
        <Text style={styles.emptyText}>换个条件看看，或稍后再刷新。</Text>
      </View>
    );
  };

  const renderJobCard = ({ item }: { item: JobEntity; index: number }) => {
    const recruiter = parseJson<RecruiterInfo>(item.memberInfo, {});
    const tags = buildTags(item);
    const recruiterName = recruiter.name || recruiter.fullName || '招聘者';
    const address = buildAddressText(item);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.card}
        onPress={() => {
          navigation.push('JobDetailPage', { id: item.id });
        }}
      >
        <View style={styles.titleRow}>
          <Text style={styles.jobName} numberOfLines={2}>{item.jobName}</Text>
          <Text style={styles.salary} numberOfLines={1}>{formatSalary(item)}</Text>
        </View>

        <Text style={styles.companyInfo} numberOfLines={1}>{buildCompanyInfo(item)}</Text>

        <View style={styles.tagRow}>
          {tags.map((tag, tagIndex) => (
            <View key={`${item.id}_${tag}_${tagIndex}`} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recruiterRow}>
          <View style={styles.recruiterInfo}>
            <View style={styles.avatarWrap}>
              {recruiter.avatar ? (
                <Image style={styles.avatar} source={{ uri: recruiter.avatar }} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{recruiterName.slice(0, 1)}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.recruiterTextWrap}>
              <Text style={styles.recruiterName} numberOfLines={1}>
                {recruiterName} · {recruiter.jobTitle || '招聘者'}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>{buildReplyText(item.replyCount)}</Text>
            </View>
          </View>

          <View style={styles.addressWrap}>
            <Text style={styles.addressText} numberOfLines={1}>{address || item.city || '位置待定'}</Text>
            <Icon name="close-outline" style={styles.closeIcon} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecommend = () => {
    return (
      <FlowList
        keyExtractor={(item: JobEntity) => `${item.id}`}
        contentContainerStyle={styles.listContainer}
        style={styles.flatList}
        data={store.jobList}
        extraData={[store.refreshing]}
        renderItem={renderJobCard}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={store.refreshing}
            tintColor={CommonColor.mainColor}
            onRefresh={onJobRefresh}
          />
        }
        onRefresh={onJobRefresh}
        onEndReachedThreshold={0.2}
        onEndReached={loadData}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    );
  };

  const handleTabChanged = (tab: number) => {
    setIndex(tab);
    store.requestJobList(JOB_LIST_TYPES[tab] || 'recommend', true);
  };

  return (
    <View style={styles.root}>
      <GradientHeader
        title="AI产品经理"
        actions={[
          { icon: 'add-outline' },
          { icon: 'search-outline' },
        ]}
      >
        <TitleBar
          tab={index}
          city="厦门"
          onAddButtonPress={(event: GestureResponderEvent) => {}}
          onTabChanged={handleTabChanged}
        />
      </GradientHeader>

      {renderRecommend()}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },

  flatList: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f4f5f7',
  },

  listContainer: {
    paddingTop: 10,
    paddingBottom: 14,
  },

  card: {
    width: CARD_WIDTH,
    minHeight: 150,
    backgroundColor: '#ffffff',
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 15,
    shadowColor: '#19202a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  jobName: {
    flex: 1,
    color: '#111111',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    paddingRight: 12,
  },

  salary: {
    color: '#0aa7a0',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },

  companyInfo: {
    marginTop: 8,
    color: '#666a70',
    fontSize: 13,
    lineHeight: 18,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: -6,
  },

  tag: {
    maxWidth: CARD_WIDTH - 42,
    backgroundColor: '#f4f4f4',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },

  tagText: {
    color: '#61656b',
    fontSize: 12,
    lineHeight: 15,
  },

  recruiterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 13,
  },

  recruiterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingRight: 10,
  },

  avatarWrap: {
    width: 30,
    height: 30,
    marginRight: 9,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'cover',
    backgroundColor: '#edf2f7',
  },

  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9f3f0',
  },

  avatarFallbackText: {
    color: '#0aa7a0',
    fontSize: 14,
    fontWeight: '700',
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 6,
    backgroundColor: '#52d641',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    position: 'absolute',
    right: -1,
    bottom: 1,
  },

  recruiterTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  recruiterName: {
    color: '#2f3338',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  replyText: {
    color: '#8b8f96',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },

  addressWrap: {
    maxWidth: 124,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },

  addressText: {
    flexShrink: 1,
    color: '#8b8f96',
    fontSize: 11,
    lineHeight: 15,
  },

  closeIcon: {
    color: '#c5c8cc',
    fontSize: 17,
    marginLeft: 7,
  },

  footerText: {
    textAlign: 'center',
    color: '#999999',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 24,
    fontSize: 12,
  },

  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  emptyTitle: {
    color: '#30343a',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },

  emptyText: {
    color: '#8b8f96',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
});
