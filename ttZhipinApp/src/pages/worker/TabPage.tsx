import React, { useState } from "react";
import {View, Text, StyleSheet, TouchableOpacity, StatusBar} from "react-native";

import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from "react-native-image-picker";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommonColor } from "../../common/CommonColor";

import JobPage from "./job/JobPage";
import DiscoveryPage from "./discovery/DiscoveryPage";
import MessagePage from "./message/MessagePage";
import MinePage from "./mine/MinePage";


const Tab = createBottomTabNavigator();
const ACTIVE_COLOR = CommonColor.mainColor;

const tabIcons = [
    { active: 'briefcase', inactive: 'briefcase-outline' },
    { active: 'book', inactive: 'book-outline' },
    { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
    { active: 'person-circle', inactive: 'person-circle-outline' },
];

export default () => {

    const navigation = useNavigation<StackNavigationProp<any>>();
    const insets = useSafeAreaInsets();

    const [process, setProcess] = useState(0);


    const MyTabBar = ({state, descriptors, navigation} : any) => {
        const {routes, index} = state;


        const onPublishPress = () => {
            launchImageLibrary({
                mediaType: 'mixed',
                quality: 1,
                includeBase64: true
            }, async (res: ImagePickerResponse) => {
                const {assets} = res;
                if(!assets?.length) {
                    console.log('选择图片失败');
                    return;
                }

                const {uri, width, height, fileName, fileSize, type} = assets[0];
                console.log(`uri=${uri}, width=${width}, height=${height}`);
                console.log(`fileName=${fileName}, fileSize=${fileSize}, type=${type}`);

                // const { data } = await ApiService.upload(apis.fileUpload.url, uri!, fileName!, type!, (event:any) => {
                //     setProcess(Math.round((100 * event.loaded) / event.total));
                // });
                // console.log("上传结果%s", data);
                // console.log("进度%s", process);

                navigation.push('PublishPage', {assets: assets});

            });
        }


        return (
            <View style={[styles.myTabBar, {height: 54 + insets.bottom, paddingBottom: Math.max(insets.bottom, 5)}]}>
                {routes.map((route: any, i: number) => {
                    const {options} = descriptors[route.key];
                    const label = options.title;
                    const isFocused = index === i;
                    const icon = tabIcons[i] || tabIcons[0];
                    const iconName = isFocused ? icon.active : icon.inactive;

                    return (

                        <TouchableOpacity activeOpacity={0.72} key={label} style={styles.myTabItem} onPress={() => {
                            if(!isFocused) {
                                navigation.navigate(route.name);
                            }

                        }}>

                            <View style={isFocused ? styles.tabContentActive : styles.tabContent}>
                                <Ionicons
                                    style={isFocused ? styles.focusedIcon : styles.unFocusedIcon}
                                    name={iconName}
                                    size={isFocused ? 20 : 19}
                                />

                                <Text style={isFocused ? styles.focusedText : styles.unFocusedText}>{label}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    }

    return (

        <View style={styles.root}>
            <StatusBar translucent backgroundColor={'transparent'} />

            <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}>

                {/* lazy为false，在首页访问的时候会自动加载页面，消息页面必须自动加载，否则会导致进入聊天界面时本地数据库未初始化 */}
                <Tab.Screen name="JobPage" component={JobPage} options={{
                    title: '职位', headerShown: false, lazy: false
                }}/>

                <Tab.Screen name="DiscoveryPage" component={DiscoveryPage} options={{
                    title: '发现', headerShown: false, lazy: false
                }}/>

                <Tab.Screen name="MessagePage" component={MessagePage} options={{
                    title: '消息', headerShown: false, lazy: false
                }}/>

                <Tab.Screen name="MinePage" component={MinePage} options={{
                    title: '我的', headerShown: false, lazy: false
                }}/>
            </Tab.Navigator>

        </View>

    );
}

const styles = StyleSheet.create({
    root: {
        width: '100%',
        height: '100%',
    },

    myTabBar: {
        width: '100%',
        flexDirection: 'row',
        alignItems: "flex-start",
        backgroundColor: "white",
        borderTopWidth: 0.5,
        borderTopColor: CommonColor.line,
        paddingTop: 3,
    },

    myTabItem: {
        height: 43,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    tabContent: {
        minWidth: 54,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },

    tabContentActive: {
        minWidth: 54,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },

    choicenessTabBar: {
        width: '100%',
        height: 52,
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: "black"
    },

    otherTabBar: {
        width: '100%',
        height: 52,
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: "white"
    },

    otherTabItem: {
        height: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },


    focusedText: {
        fontSize: 10,
        color: ACTIVE_COLOR,
        fontWeight: '700',
        marginTop: 2,
    },

    unFocusedText: {
        fontSize: 10,
        color: '#8f9399',
        fontWeight: '500',
        marginTop: 2,
    },

    focusedIcon: {
        color: ACTIVE_COLOR,
    },

    unFocusedIcon: {
        color: '#9da1a7',
    },

});
