import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonColor } from '../../../../common/CommonColor';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface TopMenuBarProps {
    name: string;
    jobTitle: string;
}

const ChatTopMenu: React.FC<TopMenuBarProps> = ({ name, jobTitle }) => {

    const navigation = useNavigation<StackNavigationProp<any>>();


    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 2 }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.topBar}>
                <View style={styles.oneLine}>
                    <Icon style={styles.leftText} size={24} color={CommonColor.fontColor} name='chevron-back-sharp' onPress={() => { navigation.goBack() }}/>
                    <Text style={styles.centerText}>{name + " · " + jobTitle}</Text>
                    <Icon style={styles.rightText} size={23} color={CommonColor.fontColor} name='menu'/>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    oneLine: {
        flexDirection: 'row', // 横向排列
        justifyContent: 'space-between', // 左中右分散对齐
        alignItems: 'center', // 垂直居中对齐
        minHeight: 34,
    },

    leftText: {
        width: 48,
        textAlign: 'left',
      },
      centerText: {
        flex: 1,
        textAlign: 'center',
        color: CommonColor.fontColor,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '700',
      },
      rightText: {
        width: 48,
        textAlign: 'right',
    },

    container: {
        backgroundColor: CommonColor.tagBg,
        borderBottomWidth: 0,
    },
    topBar: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        paddingTop: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
    },
});

export default ChatTopMenu;
