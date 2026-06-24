import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CommonColor } from '../../../../common/CommonColor';

type Props = { tab: number; onTabChanged:(tabIndex: number) => void; onAddButtonPress:any};

export default ({ tab, onTabChanged }: Props) => {
    const [tabIndex, setTabIndex] = useState<number>(tab);

    useEffect(() => {
        setTabIndex(tab);
    }, [tab]);

    return (
        <View style={styles.root}>

            <View style={[styles.titleBarLayout]}>


                {/** 标题栏-推荐 */}
                <TouchableOpacity activeOpacity={1} style={styles.tabTextButton}
                    onPress={() => {
                        setTabIndex(0);
                        onTabChanged?.(0);
                    }}
                >
                    <Text style={tabIndex === 0 ? styles.tabTextSelected : styles.tabText}>全部</Text>
                    {tabIndex === 0 && <View style={styles.tabIndicator} />}
                </TouchableOpacity>

                {/** 标题栏-附近 */}
                <TouchableOpacity activeOpacity={1} style={styles.tabTextButton}
                    onPress={() => {
                        setTabIndex(1);
                        onTabChanged?.(1);
                    }}
                >
                    <Text style={tabIndex === 1 ? styles.tabTextSelected : styles.tabText}>新招呼</Text>
                    {tabIndex === 1 && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        width: '100%',
        minHeight: 34,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },

    titleBarLayout: {
        width: '100%',
        flexDirection: 'row',
        flex: 1
    },

    tabTextButton: {
        height: 32,
        flexDirection: 'column',
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
    }
});
