import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonColor } from '../../../../common/CommonColor';

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
              {selected && <View style={styles.tabIndicator} />}
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
    marginRight: 26,
  },

  tabText: {
    color: '#626875',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },

  tabTextSelected: {
    color: '#10131a',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },

  tabIndicator: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: CommonColor.mainColor,
    marginTop: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(91, 95, 244, 0.10)',
  },

  filterText: {
    color: '#4f5563',
    fontSize: 13,
    lineHeight: 17,
  },

  filterIcon: {
    color: '#9aa1b0',
    fontSize: 10,
    marginLeft: 4,
    marginTop: 1,
  },
});
