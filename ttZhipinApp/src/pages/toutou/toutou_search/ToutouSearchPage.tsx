import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonColor } from '../../../common/CommonColor';
import GradientHeader from '../../worker/components/GradientHeader';

const hotKeywords = ['AI产品经理', '大模型', 'RAG', 'Python', '产品规划', '长沙'];

export default () => {
  const [keyword, setKeyword] = useState('');

  return (
    <View style={styles.root}>
      <GradientHeader title="搜索牛人" />

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color={CommonColor.normalGrey} />
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索岗位、技能、城市"
            placeholderTextColor={CommonColor.normalGrey}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity activeOpacity={0.72} onPress={() => setKeyword('')}>
              <Icon name="close-circle" size={18} color="#c3c8d0" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>热门搜索</Text>
          <View style={styles.chipGrid}>
            {hotKeywords.map(item => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.76}
                style={styles.chip}
                onPress={() => setKeyword(item)}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.empty}>
          <Icon name="sparkles-outline" size={40} color={CommonColor.normalGrey} />
          <Text style={styles.emptyTitle}>精准搜索 AI 牛人</Text>
          <Text style={styles.emptySubtitle}>关键词、城市、技能会优先用于人才匹配</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CommonColor.zhipinBg,
  },

  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  searchBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 13,
    borderWidth: 0.5,
    borderColor: 'rgba(91, 95, 244, 0.06)',
    shadowColor: '#34356a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },

  input: {
    flex: 1,
    height: '100%',
    color: CommonColor.fontColor,
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: 9,
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    color: '#10131a',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    paddingHorizontal: 2,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: -8,
  },

  chip: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(91, 95, 244, 0.08)',
  },

  chipText: {
    color: CommonColor.deepGrey,
    fontSize: 13,
    lineHeight: 17,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
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
  },
});
