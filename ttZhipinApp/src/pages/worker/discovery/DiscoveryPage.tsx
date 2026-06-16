import React from 'react';
import { StyleSheet, View } from 'react-native';

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
    backgroundColor: '#f4f5f7',
  },

  content: {
    flex: 1,
  },
});
