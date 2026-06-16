import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  tab: number;
  city?: string;
  onTabChanged: (tabIndex: number) => void;
  onAddButtonPress: any;
};

const tabs = ['推荐', '附近', '最新'];

export default ({ tab, city = '厦门', onTabChanged }: Props) => {
  const [tabIndex, setTabIndex] = useState<number>(tab);

  useEffect(() => {
    setTabIndex(tab);
  }, [tab]);

  const onPressTab = (nextIndex: number) => {
    setTabIndex(nextIndex);
    onTabChanged?.(nextIndex);
  };

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {tabs.map((label, currentIndex) => {
          const selected = tabIndex === currentIndex;

          return (
            <TouchableOpacity
              key={label}
              activeOpacity={0.72}
              style={styles.tabButton}
              onPress={() => onPressTab(currentIndex)}
            >
              <Text style={selected ? styles.tabTextSelected : styles.tabText}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity activeOpacity={0.72} style={styles.filterButton}>
          <Text style={styles.filterText}>{city}</Text>
          <Icon style={styles.filterIcon} name="caret-down" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} style={styles.filterButton}>
          <Text style={styles.filterText}>筛选</Text>
          <Icon style={styles.filterIcon} name="caret-down" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabButton: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 28,
  },

  tabText: {
    color: '#5f636a',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },

  tabTextSelected: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },

  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 1,
  },

  filterButton: {
    height: 28,
    minWidth: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 246, 246, 0.96)',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },

  filterText: {
    color: '#565b62',
    fontSize: 13,
    lineHeight: 17,
  },

  filterIcon: {
    color: '#c5c8cc',
    fontSize: 10,
    marginLeft: 4,
    marginTop: 1,
  },
});
