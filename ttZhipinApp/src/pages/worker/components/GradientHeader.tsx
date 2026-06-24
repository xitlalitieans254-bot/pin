import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonColor } from '../../../common/CommonColor';

type HeaderAction = {
  icon: string;
  onPress?: () => void;
};

type Props = {
  title: string;
  actions?: HeaderAction[];
  children?: React.ReactNode;
};

export default ({ title, actions = [], children }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={CommonColor.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.92 }}
      style={[styles.header, { paddingTop: insets.top + 8 }]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.icon}
                activeOpacity={0.72}
                style={styles.iconButton}
                onPress={action.onPress}
              >
                <Icon style={styles.icon} name={action.icon} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.72)',
  },

  titleRow: {
    width: '100%',
    minHeight: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    textAlign: 'left',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
    color: '#10131a',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 16,
  },

  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },

  icon: {
    fontSize: 24,
    color: '#151827',
  },
});
