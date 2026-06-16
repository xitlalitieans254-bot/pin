import { StyleSheet, Text, View, Dimensions, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import HomeStore from '../../../stores/HomeStore';
import { useLocalStore, observer } from 'mobx-react';
import Icon from 'react-native-vector-icons/Ionicons';
import FlowList from '../../../components/flowlist/FlowList.js';
import { TouchableOpacity } from 'react-native-gesture-handler';
import TitleBar from './components/TitleBar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { GestureResponderEvent } from 'react-native';
import { CommonColor } from '../../../common/CommonColor';
import { calculateDistance } from '../../../utils/DistanceUtil';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';




const {width:SCREEN_WIDTH} = Dimensions.get('window');

type JobListType = 'recommend' | 'nearby' | 'latest';

const JOB_LIST_TYPES: JobListType[] = ['recommend', 'nearby', 'latest'];
const DEFAULT_MEMBER_INFO = {
  avatar: 'https://shopzz.oss-cn-guangzhou.aliyuncs.com/other/a1.jpg',
  name: '招聘者',
  jobTitle: 'HR',
};

const safeParseJson = <T,>(value: any, fallback: T): T => {
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

const getJobTags = (value: any): string[] => {
  const tags = safeParseJson<any[]>(value, []);
  return Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
};

const formatSalary = (start?: number, end?: number) => {
  if (!start || !end) {
    return '薪资面议';
  }
  return `${Math.floor(start / 1000)} - ${Math.floor(end / 1000)}K`;
};

const getDistanceText = (item: JobEntity) => {
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return '';
  }
  return calculateDistance(28.195666, 112.962398, latitude, longitude);
};


export default observer(() => {
  const insets = useSafeAreaInsets();

  const navigation = useNavigation<StackNavigationProp<any>>();

  const store = useLocalStore(() => new HomeStore());

  const [index, setIndex] = useState<number>(0);

  const requestJobs = (tabIndex: number = index, reset: boolean = false) => {
    store.requestJobList(JOB_LIST_TYPES[tabIndex] || 'recommend', reset);
  };



  useEffect(() => {
    requestJobs(0, true);
  }, []);

  const onJobRefresh = () => {
    requestJobs(index, true);
  };

  const loadData = () => {
    requestJobs(index);
  };

  const MyFooter = () => {
    if (store.refreshing) {
      return (
        <Text style={styles.footerText}>加载中...</Text>
      );
    }

    if (store.jobList.length === 0) {
      return null;
    }

    return (
      <Text style={styles.footerText}>{store.hasMore ? '上拉加载更多' : '已经滑到底部了'}</Text>
    );
  };

  const EmptyList = () => {
    if (store.refreshing) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{store.errorMessage || '暂无职位'}</Text>
      </View>
    );
  };



    //首页职位item UI
    const renderItem = ({item, index}: {item:JobEntity, index:number}) => {
      const memberInfo = safeParseJson(item.memberInfo, DEFAULT_MEMBER_INFO);
      const jobTags = getJobTags(item.jobTags);
      const company = item.companyResponse || ({} as JobEntity['companyResponse']);
      const distanceText = getDistanceText(item);
      const styles = StyleSheet.create({
        root: {
          backgroundColor: 'white',
          width: '100%',
          flexDirection: 'column'
        },

        item: {
          width: SCREEN_WIDTH - 10,
          backgroundColor: 'white',
          marginHorizontal: 5,
          marginBottom: 6,
          borderRadius: 6,
          overflow: 'hidden'
        },

        oneLine: {
          flexDirection: 'row', // 将子组件排列在一行
          alignItems: 'center', // 垂直居中对齐
          justifyContent: 'space-between', // 在容器中水平分散对齐
          paddingHorizontal: 12,
          paddingTop: 10
        },

        oneLineJobName: {
          fontWeight: 'bold',
          fontSize: 14,
          color: 'black'
        },

        oneLineJobSalary: {
          fontWeight: '500',
          fontSize: 12,
          color: CommonColor.mainColor
        },

        twoLine: {
          flexDirection: 'row', // 将子组件排列在一行
          alignItems: 'center', // 垂直居中对齐
          paddingHorizontal: 12,
          paddingTop: 5
        },

        twoLineText: {
          fontSize: 12,
          color: CommonColor.deepGrey
        },

        threeLine: {
          flexDirection: 'row', // 将子组件排列在一行
          alignItems: 'center', // 垂直居中对齐
          paddingHorizontal: 12,
          paddingTop: 5
        },

        threeLineTag: {
          backgroundColor: CommonColor.tagBg,
          borderRadius: 5,
          paddingVertical: 2,
          paddingHorizontal: 4,
          marginRight: 3
        },
        threeLineTagText: {
          color: CommonColor.deepGrey,
          fontSize: 10
        },

        fourLine: {
          flexDirection: 'row', // 将子组件排列在一行
          alignItems: 'center', // 垂直居中对齐
          justifyContent: 'space-between', // 在容器中水平分散对齐
          paddingHorizontal: 12,
          paddingTop: 7,
          paddingBottom: 6
        },

        fourLineHR: {
          flexDirection: 'row',
          alignItems: 'center',
        },

        fourLineHRAvatar: {
          width: 18,
          height: 18,
          resizeMode: 'cover',
          borderRadius: 100
        },

        fourLineHRText:{
          color: CommonColor.fontColor,
          fontSize: 11,
          paddingLeft: 5
        },

        fourLineHRReplyText:{
          color: CommonColor.normalGrey,
          fontSize: 10,
          paddingLeft: 5
        },
      

        fourLineAddress: {
          flexDirection: 'row'
        },

        fourLineAddressInfo: {
          fontSize: 10,
          color: CommonColor.normalGrey
        },

        fourLineAddressDistance: {
          fontSize: 10,
          color: CommonColor.normalGrey,
          paddingRight: 4
        }


      });

      return (
        <>
          <TouchableOpacity onPress={() => {
            //跳转到职位详情页
            navigation.push('JobDetailPage', {id: item.id});

          }} activeOpacity={1} style={styles.item} key={index}>
            <View style={styles.root}>

              {/* 职位名与薪资范围 */}
              <View style={styles.oneLine}>
                <Text style={styles.oneLineJobName}>{item.jobName || '职位名称待完善'}</Text>
                <Text style={styles.oneLineJobSalary}>{formatSalary(item.salaryRangeStart, item.salaryRangeEnd)}</Text>
              </View>

              {/* 公司信息 */}
              <View style={styles.twoLine}>
                <Text style={styles.twoLineText}>{company.companyAbbrName || '公司待完善'} </Text>
                <Text style={styles.twoLineText}>{company.financingStage || ''} </Text>
                <Text style={styles.twoLineText}>{company.companyScale || ''} </Text>
              </View>

              {/* 岗位标签 */}
              <View style={styles.threeLine}>
                {jobTags.map((tag:any, index:number) => (
                  <View key={index} style={styles.threeLineTag}>
                    <Text style={styles.threeLineTagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* HR信息与地址信息 */}
              <View style={styles.fourLine}>
                
                <View style={styles.fourLineHR}>
                  {/* 头像 */}
                  <Image style={styles.fourLineHRAvatar} source={{uri: memberInfo.avatar || DEFAULT_MEMBER_INFO.avatar}}/>

                  <View style={{flexDirection: 'column'}}>
                    {/* HR信息 */}
                    <Text style={styles.fourLineHRText}>{(memberInfo.name || DEFAULT_MEMBER_INFO.name) + " · " + (memberInfo.jobTitle || DEFAULT_MEMBER_INFO.jobTitle)}</Text>
                    <Text style={styles.fourLineHRReplyText}>3分钟前回复</Text>
                  </View>

                </View>

                <View style={styles.fourLineAddress}>
                  <Text style={styles.fourLineAddressDistance}>{distanceText}</Text>
                  <Text style={styles.fourLineAddressInfo}>{[item.district, item.addressDetail].filter(Boolean).join(' ')}</Text>
                </View>
              </View>

            </View>
          </TouchableOpacity>

        </>
  
        
  
      );
    }

  const renderRecommend = () => {
    return (
      <>
        {/** 主页视频列表 */}
        <FlowList 
          keyExtractor={(item: JobEntity) => `${item.id}`}
          contentContainerStyle={styles.container} 
          style={styles.flatList} 
          data={store.jobList} 
          extraData={[store.refreshing, store.hasMore, store.currentListType]}
          renderItem={renderItem} 
          numColumns={1}
          refreshing={store.refreshing}
          onRefresh={onJobRefresh} 
          onEndReachedThreshold={0.2}
          onEndReached={loadData}
          ListEmptyComponent={EmptyList}
          ListFooterComponent={MyFooter}
        />
      </>
    );
  }

  return (
    
    <View style={styles.root}>
      <View style={[{paddingTop: insets.top, height: insets.top + 75}]}>
      
        {/** 顶部标题栏 */}
        <View style={styles.topTitle}>

          {/** 职位类型 */}
          <Text style={styles.leftText}>Java</Text>

          {/** 添加按钮和搜索按钮 */}
          <View style={styles.rightContainer}>
            <TouchableOpacity activeOpacity={1}>
              <Icon style={styles.rightIcon} name="add" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1}>
              <Icon style={styles.rightIcon} name="search-outline" />
            </TouchableOpacity>
          </View>
        </View>


      <TitleBar tab={index} onAddButtonPress={(event: GestureResponderEvent) => {
        }} onTabChanged={(tab: number) => {
          setIndex(tab);
          requestJobs(tab, true);
        }}/>
      </View>

      {renderRecommend()}
    </View>
    
  );

})

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  flatList: {
    width: '100%',
    height: '100%',
    backgroundColor: CommonColor.normalBg
  },

  topTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white'
  },

  leftText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 25,
    fontWeight: '500',
    color: 'black'
  },

  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  rightIcon: {
    fontSize: 25,
    color: 'black',
    paddingLeft: 10
  },

  container: {
    paddingTop: 6
  },

  footerText: {
    textAlign: 'center',
    color: '#999',
    width: '100%',
    padding: 10,
    paddingBottom: 20
  },

  emptyState: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center'
  },

  emptyStateText: {
    color: CommonColor.normalGrey,
    fontSize: 13
  },
  
});
