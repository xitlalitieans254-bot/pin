import { StyleSheet, Text, View, Dimensions, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalStore, observer } from 'mobx-react';
import FlowList from '../../../components/flowlist/FlowList.js';
import { TouchableOpacity } from 'react-native-gesture-handler';
import TitleBar from './components/TitleBar';
import { GestureResponderEvent } from 'react-native';
import { CommonColor } from '../../../common/CommonColor';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MessageStore from '../../../stores/MessageStore';
import WebSocketUtil from '../../../utils/WebSocketUtil';
import ChatWebSocket from '../../../stores/ChatWebSocket';
import DatabaseHelper from '../../../utils/DatabaseHelper';
import command from '../../../common/Command';
import { CommonConstant } from '../../../common/CommonConstant';
import StorageUtil from '../../../utils/StorageUtil';
import GradientHeader from '../components/GradientHeader';


const {width:SCREEN_WIDTH} = Dimensions.get('window');

const privateChatTableSql = "CREATE TABLE IF NOT EXISTS " + CommonConstant.IM_PRIVATE_CHAT_TABLE + " (id INTEGER PRIMARY KEY AUTOINCREMENT, content_id TEXT UNIQUE, owner_member_id TEXT, from_member_id TEXT, to_member_id TEXT, body TEXT);";
const insertPrivateChatSql = "INSERT OR IGNORE INTO " + CommonConstant.IM_PRIVATE_CHAT_TABLE + " (content_id, owner_member_id, from_member_id, to_member_id, body) VALUES (?, ?, ?, ?, ?)";
const DEFAULT_CHAT_AVATAR = 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png';

const safeParseJson = <T,>(text: unknown, fallback: T): T => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return fallback;
  }
};

const toIdString = (value: unknown) => String(value ?? '').trim();

const getCounterpartMemberId = (chat: PrivateChatMessage, currentMemberId?: string) => {
  const fromMemberId = String(chat.data.fromMemberId);
  const toMemberId = String(chat.data.toMemberId);
  if (currentMemberId) {
    return fromMemberId === currentMemberId ? toMemberId : fromMemberId;
  }
  return chat.command === command.MessageCommand.PRIVATE_CHAT_ACK ? toMemberId : fromMemberId;
};

export default observer(() => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const store = useLocalStore(() => new MessageStore());

  const [index, setIndex] = useState<number>(0);
  const currentMemberIdRef = useRef<string>('');

  useEffect(() => {
    WebSocketUtil.addListener('message', handleMessage);
    WebSocketUtil.addListener('open', handleOpen);
    WebSocketUtil.connect();
    if (WebSocketUtil.isConnected()) {
      ChatWebSocket.login();
    }

    store.requestTalkList();

    StorageUtil.getItem(CommonConstant.MEMBER_INFO).then(data => {
      if (data !== null) {
        const memberId = String(JSON.parse(data).id);
        currentMemberIdRef.current = memberId;
      }
    });

    const tableReady = DatabaseHelper.initializeDatabase(CommonConstant.IM_DB_NAME)
    .then(() => {
      console.log('Database initialized');

      return DatabaseHelper.executeQuery(privateChatTableSql);
    })
    .then(() => {
      console.log('Table initialized');
    });

    //获取离线消息

    StorageUtil.getItem(CommonConstant.OFFLINE_MESSAGE_SEQ).then(res => {
      let finalRes = '0';
      if(res !== null) {
        finalRes = res;
      }

      store.requestOfflineMessageList(finalRes, (setList: PrivateChatMessage[]) => {
        console.log("获取到离线消息，需要将离线消息持久化到本地数据库:", setList);

        if(setList.length !== 0) {
        //遍历所有离线消息，并持久化到APP本地
        setList.forEach(element => {

          try {
            //将消息持久化到本地数据库SQLite中
            tableReady.then(() => DatabaseHelper.executeQuery(insertPrivateChatSql, [
              String(element.data.contentId),
              getCounterpartMemberId(element, currentMemberIdRef.current),
              String(element.data.fromMemberId),
              String(element.data.toMemberId),
              JSON.stringify(element),
            ]))
              .then((res) => {
                console.log('record add success', res);
              })
              .catch((error) => {
                console.error('record add fail:', error);
              });
          } catch (error) {
            console.log("error输出:", error);
          }
        });

        //记录最后的序列号
        const lastElement = setList[setList.length - 1];
        console.log("这波离线消息最新的序列号", lastElement.data.sequence);

        StorageUtil.setItem(CommonConstant.OFFLINE_MESSAGE_SEQ, String(lastElement.data.sequence));
        }
      });
    });

    return () => {
      WebSocketUtil.removeListener(handleMessage);
      WebSocketUtil.removeListener(handleOpen);
    };

  }, []);

  const handleOpen = () => {
    return ChatWebSocket.login();
  }

  const handleMessage = (message: any) => {
    const chat: PrivateChatMessage = JSON.parse(message);
    console.log("接收到的消息:", chat);

    if (chat.command === command.MessageCommand.PRIVATE_CHAT) {
      //将消息持久化到本地数据库SQLite中
      DatabaseHelper.initializeDatabase(CommonConstant.IM_DB_NAME)
        .then(() => DatabaseHelper.executeQuery(privateChatTableSql))
        .then(() => DatabaseHelper.executeQuery(insertPrivateChatSql, [
        String(chat.data.contentId),
        getCounterpartMemberId(chat, currentMemberIdRef.current),
        String(chat.data.fromMemberId),
        String(chat.data.toMemberId),
        message,
      ]))
        .then(() => {
          console.log('record add success');
        })
        .catch((error) => {
          console.error('record add fail:', error);
        });
      return;
    }

    //接收到自己发送消息的ack，将ack消息存到数据库中
    if(chat.command === command.MessageCommand.PRIVATE_CHAT_ACK) {
      //将消息持久化到本地数据库SQLite中
      DatabaseHelper.initializeDatabase(CommonConstant.IM_DB_NAME)
        .then(() => DatabaseHelper.executeQuery(privateChatTableSql))
        .then(() => DatabaseHelper.executeQuery(insertPrivateChatSql, [
        String(chat.data.contentId),
        getCounterpartMemberId(chat, currentMemberIdRef.current),
        String(chat.data.fromMemberId),
        String(chat.data.toMemberId),
        message,
      ]))
        .then(() => {
          console.log('record add success');
        })
        .catch((error) => {
          console.error('record add fail:', error);
        });
      return;
    }


  }

  const onJobRefresh = () => {
    store.resetPage();
    store.requestTalkList();
  };

  const loadData = () => {
    store.requestTalkList();
  };

  const MyFooter = () => {
    return (
      <Text style={{
        textAlign: 'center',
        color: '#999',
        width: '100%',
        padding: 10,
        paddingBottom: 20,
        fontSize: 12
      }}>以上是30天内的联系人</Text>
    );
  };



    //首页职位item UI
    const renderItem = ({item, index}: {item:TalkEntity, index:number}) => {
      const peerMemberId = toIdString(item.fromMemberId);
      const memberInfo = safeParseJson<Record<string, any>>(item.fromMemberInfo, {});
      const avatarUrl = String(memberInfo.avatar || DEFAULT_CHAT_AVATAR).trim();
      const displayName = String(memberInfo.name || `用户${peerMemberId.slice(-4)}`);
      const companyText = [memberInfo.companyAbbrName, memberInfo.jobTitle].filter(Boolean).join('·');
      const styles = StyleSheet.create({
        root: {
          backgroundColor: CommonColor.zhipinBg,
          width: '100%',
          flexDirection: 'column',
          paddingVertical: 2,
        },

        item: {
          width: SCREEN_WIDTH,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },

        fourLine: {
          flexDirection: 'row', // 将子组件排列在一行
          alignItems: 'flex-start', // 垂直居中对齐
          justifyContent: 'space-between', // 在容器中水平分散对齐
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 12
        },

        fourLineHR: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          paddingRight: 12,
        },

        fourLineHRAvatar: {
          width: 46,
          height: 46,
          resizeMode: 'cover',
          borderRadius: 23,
          backgroundColor: '#eef2ff',
        },

        fourLineHRText:{
          paddingLeft: 10,
          flexDirection: 'row',
          alignItems: 'center',
        },

        fourLineName:{
          fontSize: 15,
          lineHeight: 20,
          color: '#20232c',
          fontWeight: '700',
        },

        fourLineCompanyAbbrName:{
          fontSize: 12,
          lineHeight: 17,
          paddingLeft: 6,
          color: CommonColor.deepGrey,
        },

        fourLineHRReplyText:{
          color: CommonColor.mainColor,
          fontSize: 12,
          lineHeight: 18,
          paddingLeft: 10,
          paddingTop: 5,
          fontWeight: '600',
        },

        fourLineHRReplyText2: {
          color: CommonColor.deepGrey,
          fontSize: 12,
          lineHeight: 18,
          paddingLeft: 5,
          paddingTop: 5,
          flex: 1,
        },


        messageTip: {
          flexDirection: 'row',
          maxWidth: SCREEN_WIDTH - 112,
        },


        fourLineAddress: {
          flexDirection: 'row',
          paddingTop: 2,
        },

        fourLineAddressInfo: {
          fontSize: 11,
          lineHeight: 16,
          color: CommonColor.normalGrey
        },

        fourLineAddressDistance: {
          fontSize: 10,
          color: CommonColor.normalGrey,
          paddingRight: 4
        }


      });

      return (
        <>
          <TouchableOpacity onPress={() => {
            if (!peerMemberId) {
              return;
            }

            //跳转到聊天页
            navigation.push('ChatPage', {
              memberId: peerMemberId,
              fromMemberId: String(item.fromMemberId),
              toMemberId: String(item.toMemberId),
              avatar: avatarUrl,
              name: displayName,
              jobTitle: String(memberInfo.jobTitle || ''),
              companyAbbrName: String(memberInfo.companyAbbrName || ''),
            });

          }} activeOpacity={1} style={styles.item} key={index}>
            <View style={styles.root}>

              {/* HR信息与地址信息 */}
              <View style={styles.fourLine}>

                <View style={styles.fourLineHR}>
                  {/* 头像 */}
                  <Image style={styles.fourLineHRAvatar} source={{uri: avatarUrl}}/>

                  <View style={{flexDirection: 'column'}}>
                    {/* HR信息 */}
                    <View style={styles.fourLineHRText}>
                      <Text style={styles.fourLineName}>{displayName}</Text>
                      <Text style={styles.fourLineCompanyAbbrName}>{companyText}</Text>
                    </View>

                    <View style={styles.messageTip}>
                      <Text style={styles.fourLineHRReplyText}>[新招呼]</Text>
                      <Text style={styles.fourLineHRReplyText2} numberOfLines={1}>您好，我是负责AI岗位招聘的顾问...</Text>
                    </View>
                  </View>

                </View>

                <View style={styles.fourLineAddress}>
                  <Text style={styles.fourLineAddressInfo}>{item.createdAt}</Text>
                </View>
              </View>

            </View>
          </TouchableOpacity>

        </>



      );
    }

  const renderRecommend = () => {
    return (
      <>
        {/** 主页视频列表 */}
        <FlowList
          keyExtractor={(item: TalkEntity) => `${item.id}`}
          contentContainerStyle={styles.container}
          style={styles.flatList}
          data={store.talkList}
          extraData={[store.refreshing]}
          renderItem={renderItem}
          numColumns={1}
          refreshing={store.refreshing}
          onRefresh={onJobRefresh}
          onEndReachedThreshold={0.2}
          onEndReached={loadData}
          ListFooterComponent={MyFooter}
        />
      </>
    );
  }

  const renderNearBy = () => {
    return (
      <View style={{alignContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'row'}}>
        <Text>附近列表</Text>
      </View>
    );
  }

  const renderLatest = () => {
    return (
      <View style={{alignContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'row'}}>
        <Text>最新列表</Text>
      </View>
    );
  }



  return (

    <View style={styles.root}>
      <GradientHeader
        title="消息"
        actions={[
          { icon: 'notifications-outline' },
          { icon: 'settings-outline' },
        ]}
      >
        <TitleBar tab={0} onAddButtonPress={(event: GestureResponderEvent) => {
          }} onTabChanged={(tab: number) => { setIndex(tab); }}/>
      </GradientHeader>

      {index === 0 ? renderRecommend() : renderNearBy()}
    </View>

  );

})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CommonColor.zhipinBg,
  },

  flatList: {
    width: '100%',
    height: '100%',
    backgroundColor: CommonColor.zhipinBg
  },

  container: {
    paddingTop: 9,
    paddingBottom: 12,
  },

});
