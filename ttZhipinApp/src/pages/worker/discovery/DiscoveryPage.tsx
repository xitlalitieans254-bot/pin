import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CommonColor } from '../../../common/CommonColor';
import GradientHeader from '../components/GradientHeader';

export default () => {
  return (
    <View style={styles.root}>
      <GradientHeader
        title="发现"
        actions={[
          { icon: 'search-outline' },
        ]}
      />

      <View style={styles.content} />
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
  },
});
