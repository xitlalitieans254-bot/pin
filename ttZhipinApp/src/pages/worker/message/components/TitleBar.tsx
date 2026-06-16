import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

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
                </TouchableOpacity>

                {/** 标题栏-附近 */}
                <TouchableOpacity activeOpacity={1} style={styles.tabTextButton}
                    onPress={() => {
                        setTabIndex(1);
                        onTabChanged?.(1);
                    }}
                >
                    <Text style={tabIndex === 1 ? styles.tabTextSelected : styles.tabText}>新招呼</Text>
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
    }
});
