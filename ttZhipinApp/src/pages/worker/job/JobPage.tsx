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

const parseJson = <T,>(value: string | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
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
          tab={0}
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

  card: {
    width: CARD_WIDTH,
    minHeight: 154,
    backgroundColor: '#ffffff',
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 15,
    shadowColor: '#34356a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(91, 95, 244, 0.06)',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  jobName: {
    flex: 1,
    color: '#10131a',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    paddingRight: 12,
  },

  salary: {
    color: CommonColor.salaryColor,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },

  companyInfo: {
    marginTop: 8,
    color: CommonColor.deepGrey,
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
    backgroundColor: '#eef2ff',
  },

  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },

  avatarFallbackText: {
    color: CommonColor.mainColor,
    fontSize: 14,
    fontWeight: '700',
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 6,
    backgroundColor: CommonColor.mainColorViolet,
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
    color: '#252936',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  replyText: {
    color: CommonColor.normalGrey,
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
    color: CommonColor.normalGrey,
    fontSize: 11,
    lineHeight: 15,
  },

  closeIcon: {
    color: '#b8bdc9',
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
});
