import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import BossStore from '../../../stores/BossStore';
import { CommonColor } from '../../../common/CommonColor';

const formatSalary = (item: JobEntity) => {
  if (!item.salaryRangeStart && !item.salaryRangeEnd) {
    return '薪资面议';
  }

  if (item.salaryRangeStart && item.salaryRangeEnd) {
    return `${item.salaryRangeStart}-${item.salaryRangeEnd}K`;
  }

  return item.salaryRangeStart ? `${item.salaryRangeStart}K起` : `${item.salaryRangeEnd}K以内`;
};

const compactText = (parts: Array<string | number | undefined | null>) => {
  return parts
    .map(item => (item === undefined || item === null ? '' : String(item).trim()))
    .filter(Boolean)
    .join(' · ');
};

export default observer(() => {
  const store = useLocalStore(() => new BossStore());
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    store.requestBossJobList(true);
  }, []);

  const refresh = () => {
    store.requestBossJobList(true);
  };

  const changeStatus = (item: JobEntity) => {
    const currentStatus = Number((item as any).status ?? 1);
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? '上架' : '下架';

    Alert.alert(`${actionText}职位`, `确定${actionText}「${item.jobName || '未命名职位'}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: actionText,
        onPress: async () => {
          const res = await store.changeBossJobStatus(String(item.id), nextStatus);
          if (res?.code === 0) {
            refresh();
          } else {
            Alert.alert(`${actionText}失败`, res?.message || '请稍后再试');
          }
        },
      },
    ]);
  };

  const deleteJob = (item: JobEntity) => {
    Alert.alert('删除职位', `删除后不可恢复，确定删除「${item.jobName || '未命名职位'}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const res = await store.deleteBossJob(String(item.id));
          if (res?.code === 0) {
            refresh();
          } else {
            Alert.alert('删除失败', res?.message || '请稍后再试');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: JobEntity }) => {
    const status = Number((item as any).status ?? 1);
    const company = item.companyResponse || ({} as JobEntity['companyResponse']);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.jobName} numberOfLines={1}>{item.jobName || '未命名职位'}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {compactText([item.city, item.district, item.educationAttainment]) || '职位信息待完善'}
            </Text>
          </View>
          <View style={status === 1 ? styles.statusOnline : styles.statusOffline}>
            <Text style={status === 1 ? styles.statusOnlineText : styles.statusOfflineText}>
              {status === 1 ? '上架中' : '已下架'}
            </Text>
          </View>
        </View>

        <Text style={styles.salary}>{formatSalary(item)}</Text>
        <Text style={styles.company} numberOfLines={1}>
          {company.companyAbbrName || company.companyFullName || '企业资料待完善'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.8} style={styles.actionButton} onPress={() => changeStatus(item)}>
            <Text style={styles.actionText}>{status === 1 ? '下架' : '上架'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.actionButton} onPress={() => {
            Alert.alert('编辑职位', '职位编辑表单下一步接入。');
          }}>
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.deleteButton} onPress={() => deleteJob(item)}>
            <Text style={styles.deleteText}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Icon name="briefcase-outline" size={42} color={CommonColor.normalGrey} />
      <Text style={styles.emptyTitle}>{store.errorMessage || '暂无职位'}</Text>
      <Text style={styles.emptySubtitle}>发布职位表单接入后，可以在这里管理招聘职位</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={CommonColor.fontColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的职位</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          Alert.alert('发布职位', '职位发布表单下一步接入。');
        }}>
          <Icon name="add" size={24} color={CommonColor.fontColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={store.jobList.length ? styles.listContent : styles.emptyContent}
        data={store.jobList.slice()}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={store.refreshing}
        onRefresh={refresh}
        onEndReached={() => store.requestBossJobList(false)}
        onEndReachedThreshold={0.2}
        ListEmptyComponent={!store.refreshing ? renderEmpty : null}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CommonColor.normalBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CommonColor.line,
  },
  headerButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: CommonColor.fontColor,
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  jobName: {
    color: CommonColor.fontColor,
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    marginTop: 6,
    color: CommonColor.deepGrey,
    fontSize: 12,
  },
  statusOnline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: CommonColor.transparentMainColor,
  },
  statusOffline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#eef0f3',
  },
  statusOnlineText: {
    color: CommonColor.mainColor,
    fontSize: 11,
    fontWeight: '700',
  },
  statusOfflineText: {
    color: CommonColor.normalGrey,
    fontSize: 11,
    fontWeight: '700',
  },
  salary: {
    marginTop: 10,
    color: CommonColor.salaryColor,
    fontSize: 18,
    fontWeight: '800',
  },
  company: {
    marginTop: 6,
    color: CommonColor.deepGrey,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CommonColor.line,
  },
  actionButton: {
    minWidth: 54,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 5,
    backgroundColor: CommonColor.greyButtonBg,
  },
  actionText: {
    color: CommonColor.fontColor,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    minWidth: 54,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 5,
    backgroundColor: '#fff1f1',
  },
  deleteText: {
    color: '#d33',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    color: CommonColor.fontColor,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
