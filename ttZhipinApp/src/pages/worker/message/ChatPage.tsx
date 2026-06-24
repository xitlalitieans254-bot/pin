import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GiftedChat, Bubble, Send, IMessage, Composer } from 'react-native-gifted-chat';
// 引入中文语言包
import 'dayjs/locale/zh-cn';
import { Alert, ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { CommonColor } from '../../../common/CommonColor';
import ChatTopMenu from './components/ChatTopMenu';
import { useRoute } from '@react-navigation/native';
import WebSocketUtil from '../../../utils/WebSocketUtil';
import DatabaseHelper from '../../../utils/DatabaseHelper';
import command from '../../../common/Command';
import ChatWebSocket from '../../../stores/ChatWebSocket';
import StorageUtil from '../../../utils/StorageUtil';
import { CommonConstant } from '../../../common/CommonConstant';
import uuid from 'react-native-uuid';
import ApiService from '../../../apis/ApiService';
import apis from '../../../apis/apis';
import DocumentPicker, { isCancel } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const privateChatTableSql = "CREATE TABLE IF NOT EXISTS " + CommonConstant.IM_PRIVATE_CHAT_TABLE + " (id INTEGER PRIMARY KEY AUTOINCREMENT, content_id TEXT UNIQUE, owner_member_id TEXT, from_member_id TEXT, to_member_id TEXT, body TEXT);";
const insertPrivateChatSql = "INSERT OR IGNORE INTO " + CommonConstant.IM_PRIVATE_CHAT_TABLE + " (content_id, owner_member_id, from_member_id, to_member_id, body) VALUES (?, ?, ?, ?, ?)";
const DEFAULT_CHAT_AVATAR = 'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png';
const HISTORY_PAGE_SIZE = 30;

type ChatHistoryItem = {
  contentId: SnowflakeIdInput;
  fromMemberId: SnowflakeIdInput;
  toMemberId: SnowflakeIdInput;
  ownerId?: SnowflakeIdInput;
  messageType?: number;
  sequence?: SnowflakeIdInput;
  messageContent?: string;
  body?: string;
  mine?: boolean;
  createdAt?: string;
};

const toIdString = (value: unknown) => String(value ?? '').trim();

const resolvePeerMemberId = (routeParams: any) => {
  const fromMemberId = toIdString(routeParams?.fromMemberId);
  if (fromMemberId) {
    return fromMemberId;
  }

  return toIdString(routeParams?.peerMemberId || routeParams?.targetMemberId || routeParams?.memberId);
};

const parseChatDate = (value?: string) => {
  if (!value) {
    return new Date();
  }

  const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const compareSequence = (left: string, right: string) => {
  if (left.length !== right.length) {
    return left.length - right.length;
  }

  return left.localeCompare(right);
};

const getOldestSequence = (chats: PrivateChatMessage[]) => {
  const sequences = chats
    .map(chat => String(chat.data.sequence || ''))
    .filter(Boolean);

  if (sequences.length === 0) {
    return '';
  }

  return sequences.sort(compareSequence)[0];
};

const sortChatsForGifted = (chats: PrivateChatMessage[]) => {
  return [...chats].sort((left, right) => {
    const leftSequence = String(left.data.sequence || '');
    const rightSequence = String(right.data.sequence || '');
    if (leftSequence && rightSequence) {
      return compareSequence(rightSequence, leftSequence);
    }

    return parseChatDate(right.sendAt).getTime() - parseChatDate(left.sendAt).getTime();
  });
};

const getCounterpartMemberId = (chat: PrivateChatMessage, currentMemberId?: string) => {
  const fromMemberId = String(chat.data.fromMemberId);
  const toMemberId = String(chat.data.toMemberId);
  if (currentMemberId) {
    return fromMemberId === currentMemberId ? toMemberId : fromMemberId;
  }
  return chat.command === command.MessageCommand.PRIVATE_CHAT_ACK ? toMemberId : fromMemberId;
};

const savePrivateChatMessage = (chat: PrivateChatMessage, rawMessage: string, currentMemberId?: string) => {
  return DatabaseHelper.initializeDatabase(CommonConstant.IM_DB_NAME)
    .then(() => DatabaseHelper.executeQuery(privateChatTableSql))
    .then(() => DatabaseHelper.executeQuery(insertPrivateChatSql, [
      String(chat.data.contentId),
      getCounterpartMemberId(chat, currentMemberId),
      String(chat.data.fromMemberId),
      String(chat.data.toMemberId),
      rawMessage,
    ]));
};

const historyItemToPrivateChat = (item: ChatHistoryItem): PrivateChatMessage => {
  const contentId = String(item.contentId || item.sequence || uuid.v4().toString());
  const fromMemberId = String(item.fromMemberId);
  const toMemberId = String(item.toMemberId);
  const body = String(item.messageContent || item.body || '');

  return {
    toMemberId,
    clientType: 1,
    command: item.mine ? command.MessageCommand.PRIVATE_CHAT_ACK : command.MessageCommand.PRIVATE_CHAT,
    imei: '',
    data: {
      contentId,
      messageId: contentId,
      fromMemberId,
      toMemberId,
      body,
      sequence: String(item.sequence || ''),
    },
    ackStatus: 1,
    sendAt: String(item.createdAt || ''),
  };
};

const privateChatToGiftedMessage = (
  chat: PrivateChatMessage,
  currentMemberId: string,
  currentAvatar: string,
  peerAvatar: string,
): IMessage => ({
  _id: String(chat.data.contentId || chat.data.messageId || uuid.v4().toString()),
  text: chat.data.body,
  createdAt: parseChatDate(chat.sendAt),
  user: {
    _id: String(chat.data.fromMemberId),
    avatar: String(chat.data.fromMemberId) === currentMemberId ? currentAvatar : peerAvatar,
  },
});

const dedupeGiftedMessages = (messageList: IMessage[]) => {
  const seen = new Set<string>();
  return messageList.filter(message => {
    const key = String(message._id);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getCachedOrRemoteMemberInfo = async () => {
  const cachedMemberInfo = await StorageUtil.getItem(CommonConstant.MEMBER_INFO);
  if (cachedMemberInfo) {
    try {
      const parsedMemberInfo = JSON.parse(cachedMemberInfo);
      if (parsedMemberInfo?.id) {
        return parsedMemberInfo;
      }
    } catch (error) {
      console.error('解析当前用户缓存失败:', error);
    }
  }

  const { data } = await ApiService.request('memberInfo');
  if (data?.code === 0 && data.data?.id) {
    await StorageUtil.setItem(CommonConstant.MEMBER_INFO, JSON.stringify(data.data));
    return data.data;
  }

  return null;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [composerText, setComposerText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const insets = useSafeAreaInsets();
  const inputToolbarHeight = 112 + insets.bottom;

  const { params } = useRoute<any>();

  const [avatar, setAvatar] = useState<string>(DEFAULT_CHAT_AVATAR);
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(false);
  const currentMemberIdRef = useRef<string>('');
  const peerMemberIdRef = useRef<string>('');
  const oldestSequenceRef = useRef<string>('');



  useEffect(() => {
    console.log("接收到跳转页面带过来的参数", params);
    getCachedOrRemoteMemberInfo()
      .then(memberInfo => {
        console.log("获取到当前用户信息:", memberInfo);

        if (memberInfo) {
          const memberAvatar = String(memberInfo.avatar || '').trim() || DEFAULT_CHAT_AVATAR;
          console.log(memberInfo.id);
          setAvatar(memberAvatar);
          currentMemberIdRef.current = String(memberInfo.id);
          setCurrentMemberId(String(memberInfo.id));
          peerMemberIdRef.current = resolvePeerMemberId(params);

          //初始化私聊消息表
          const tableReady = DatabaseHelper.initializeDatabase(CommonConstant.IM_DB_NAME)
            .then(() => DatabaseHelper.executeQuery(privateChatTableSql))
            .then(() => {
              console.log('Table initialized');
            });

          WebSocketUtil.addListener('chatMessage', handleMessage);
          WebSocketUtil.addListener('close', handleClose);
          WebSocketUtil.addListener('open', handleOpen);
          WebSocketUtil.connect();
          if (WebSocketUtil.isConnected()) {
            ChatWebSocket.login();
          }

          tableReady
            .then(() => syncHistoryMessages())
            .then(historyChats => {
              if (historyChats.length > 0) {
                renderChatMessages(historyChats, memberInfo.id, memberAvatar);
                return;
              }

              loadLocalMessages(memberInfo.id, memberAvatar);
            })
            .catch(error => {
              console.error('同步历史消息失败:', error);
              loadLocalMessages(memberInfo.id, memberAvatar);
            });
        }

      })
      .catch(error => {
        console.error('初始化聊天页失败:', error);
      });

    return () => {
      WebSocketUtil.removeListener(handleMessage);
      WebSocketUtil.removeListener(handleClose);
      WebSocketUtil.removeListener(handleOpen);
    };


  }, []);

  const handleOpen = () => {
    return ChatWebSocket.login();
  }

  const handleClose = () => {
    WebSocketUtil.connect();
  }

  const requestHistoryMessages = async (beforeSequence?: string) => {
    const peerMemberId = peerMemberIdRef.current || resolvePeerMemberId(params);
    if (!peerMemberId) {
      return [];
    }

    const paramsBody: Record<string, any> = {
      targetMemberId: peerMemberId,
      page: 1,
      size: HISTORY_PAGE_SIZE,
    };

    if (beforeSequence) {
      paramsBody.beforeSequence = beforeSequence;
    }

    const { data } = await ApiService.request('messageHistoryList', paramsBody);
    if (data?.code !== 0) {
      return [];
    }

    const list = data?.data?.list || data?.list || data?.data;
    return Array.isArray(list) ? list as ChatHistoryItem[] : [];
  };

  const syncHistoryMessages = async (beforeSequence?: string) => {
    const historyItems = await requestHistoryMessages(beforeSequence);
    const historyChats = historyItems.map(historyItemToPrivateChat);

    await Promise.all(historyChats.map(chat => (
      savePrivateChatMessage(chat, JSON.stringify(chat), currentMemberIdRef.current)
        .catch(error => {
          console.error('缓存历史消息失败:', error);
        })
    )));

    if (historyChats.length > 0) {
      const oldestSequence = getOldestSequence(historyChats);
      if (oldestSequence && (!oldestSequenceRef.current || compareSequence(oldestSequence, oldestSequenceRef.current) < 0)) {
        oldestSequenceRef.current = oldestSequence;
      }
    }

    setHasEarlierMessages(historyItems.length >= HISTORY_PAGE_SIZE && !!oldestSequenceRef.current);
    return historyChats;
  };

  const renderChatMessages = (
    privateChats: PrivateChatMessage[],
    memberId: SnowflakeIdInput,
    memberAvatar: string,
  ) => {
    const peerAvatar = String(params.avatar || DEFAULT_CHAT_AVATAR);
    const messageList = sortChatsForGifted(privateChats).map(obj => privateChatToGiftedMessage(
      obj,
      String(memberId),
      memberAvatar,
      peerAvatar,
    ));

    setMessages(dedupeGiftedMessages(messageList));
  };

  const loadLocalMessages = (memberId: SnowflakeIdInput, memberAvatar: string) => {
    const peerMemberId = peerMemberIdRef.current || resolvePeerMemberId(params);
    if (!peerMemberId) {
      setMessages([]);
      return;
    }

    const peerAvatar = String(params.avatar || DEFAULT_CHAT_AVATAR);
    const sql = 'SELECT * FROM ' + CommonConstant.IM_PRIVATE_CHAT_TABLE + ' where owner_member_id = ? order by id desc';

    DatabaseHelper.executeSQL(sql, [peerMemberId])
      .then((data) => {
        const privateChats: PrivateChatMessage[] = [];

        data.forEach(e => {
          try {
            const obj: PrivateChatMessage = JSON.parse(e.body);
            privateChats.push(obj);
          } catch (error) {
            console.error('解析本地聊天记录失败:', error);
          }
        });

        const messageList = sortChatsForGifted(privateChats).map(obj => privateChatToGiftedMessage(
          obj,
          String(memberId),
          memberAvatar,
          peerAvatar,
        ));

        const oldestSequence = getOldestSequence(privateChats);
        if (oldestSequence) {
          oldestSequenceRef.current = oldestSequence;
        }

        setMessages(dedupeGiftedMessages(messageList));
      })
      .catch((error) => {
        console.error('加载本地数据库消息到UI中执行错误:', error, sql);
      });
  };

  const handleLoadEarlier = async () => {
    if (loadingEarlier || !hasEarlierMessages || !oldestSequenceRef.current) {
      return;
    }

    try {
      setLoadingEarlier(true);
      const historyChats = await syncHistoryMessages(oldestSequenceRef.current);
      const peerAvatar = String(params.avatar || DEFAULT_CHAT_AVATAR);
      const olderMessages = historyChats
        .map(chat => privateChatToGiftedMessage(chat, currentMemberIdRef.current, avatar, peerAvatar))
        .reverse();

      setMessages(previousMessages => dedupeGiftedMessages([...previousMessages, ...olderMessages]));
    } catch (error) {
      console.error('加载更早历史消息失败:', error);
    } finally {
      setLoadingEarlier(false);
    }
  };

  const handleMessage = (message: any) => {
    const chat: PrivateChatMessage = JSON.parse(message);
    console.log("ChatPage 接收到的消息:", chat);
    const peerMemberId = peerMemberIdRef.current || resolvePeerMemberId(params);

    if (chat.command === command.MessageCommand.PRIVATE_CHAT) {
      if (getCounterpartMemberId(chat, currentMemberIdRef.current) !== peerMemberId) {
        return;
      }

      savePrivateChatMessage(chat, message, currentMemberIdRef.current)
        .then(() => {
          console.log('record add success');
        })
        .catch((error) => {
          console.error('record add fail:', error);
        });

      //接收到其他人发送过来的消息，添加到message中
      var newMessage = privateChatToGiftedMessage(
        chat,
        currentMemberIdRef.current,
        avatar,
        String(params.avatar || DEFAULT_CHAT_AVATAR),
      );

      console.log("接收到消息：", newMessage);
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
      return;
    }

    //接收到自己发送消息的ack，将ack消息存到数据库中
    if(chat.command === command.MessageCommand.PRIVATE_CHAT_ACK) {
      if (getCounterpartMemberId(chat, currentMemberIdRef.current) !== peerMemberId) {
        return;
      }

      savePrivateChatMessage(chat, message, currentMemberIdRef.current)
        .then(() => {
          console.log('record add success');
        })
        .catch((error) => {
          console.error('record add fail:', error);
        });
      return;
    }


  }

  const sendPlainTextMessage = useCallback((text: string) => {
    const peerMemberId = peerMemberIdRef.current || resolvePeerMemberId(params);
    const finalText = text.trim();
    if (!peerMemberId || !finalText) {
      return;
    }

    ChatWebSocket.sendPrivateChatMessage(finalText, peerMemberId);
    setMessages(previousMessages => GiftedChat.append(previousMessages, [{
      _id: uuid.v4().toString(),
      text: finalText,
      createdAt: new Date(),
      user: {
        _id: currentMemberIdRef.current || currentMemberId || '0',
        avatar,
      },
    }]));
  }, [avatar, currentMemberId, params]);

  const onSend = useCallback((msg: IMessage[] = []) => {
    sendPlainTextMessage(msg[0]?.text || '');
    setComposerText('');
  }, [sendPlainTextMessage]);

  const handleAttachFile = useCallback(async () => {
    if (uploadingFile) {
      return;
    }

    try {
      setUploadingFile(true);
      const pickerResult = await DocumentPicker.pickSingle({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
      });
      const fileUri = pickerResult.fileCopyUri || pickerResult.uri;
      const fileName = pickerResult.name || `attachment-${Date.now()}`;
      const fileType = pickerResult.type || 'application/octet-stream';
      const { data } = await ApiService.upload(apis.fileUpload.url, fileUri, fileName, fileType);
      const uploadedData = data?.data || {};
      const uploadedUrl = String(uploadedData.url || data?.url || '').trim();
      const originalFilename = String(uploadedData.originalFilename || data?.originalFilename || fileName);

      if (!uploadedUrl) {
        throw new Error('文件上传成功，但没有返回文件链接');
      }

      sendPlainTextMessage(`[文件] ${originalFilename}\n${uploadedUrl}`);
    } catch (error: any) {
      if (isCancel(error)) {
        return;
      }
      Alert.alert('文件上传失败', error?.message || '请稍后再试');
    } finally {
      setUploadingFile(false);
    }
  }, [sendPlainTextMessage, uploadingFile]);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        textStyle={{
          right: {
            color: "#FFF",
            fontSize: 13,
            lineHeight: 19,
          },

          left: {
            color: CommonColor.fontColor,
            fontSize: 13,
            lineHeight: 19,
          }
        }}

        wrapperStyle={{
          left: {
            backgroundColor: '#fff',
            borderRadius: 15,
            paddingVertical: 3,
            paddingHorizontal: 5,
          },
          right: {
            backgroundColor: CommonColor.mainColor,
            borderRadius: 15,
            paddingVertical: 3,
            paddingHorizontal: 5
          },
        }}
      />
    );
  };

  const renderQuickActions = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.quickActionsContent}
      >
        <TouchableOpacity style={styles.quickActionChip} activeOpacity={0.82}>
          <Icon name="call-outline" size={15} color={CommonColor.mainColor} />
          <Text style={styles.quickActionText}>换电话</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionChip} activeOpacity={0.82}>
          <AntDesign name="wechat" size={15} color={CommonColor.wxColor} />
          <Text style={styles.quickActionText}>换微信</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionChip} activeOpacity={0.82}>
          <AntDesign name="filetext1" size={15} color={CommonColor.mainColor} />
          <Text style={styles.quickActionText}>发简历</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionChip} activeOpacity={0.82}>
          <AntDesign name="closecircleo" size={15} color={CommonColor.normalGrey} />
          <Text style={styles.quickActionText}>不感兴趣</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderInputToolbar = (props:any) => {
    const hasText = composerText.trim().length > 0;

    return (
      <View style={[styles.inputToolbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {renderQuickActions()}

        <View style={styles.inputCapsule}>
          <TouchableOpacity
            style={styles.inputSideButton}
            activeOpacity={0.78}
            disabled={uploadingFile}
            onPress={handleAttachFile}
          >
            <Icon
              name={uploadingFile ? 'cloud-upload-outline' : 'attach-outline'}
              size={24}
              color={uploadingFile ? CommonColor.mainColor : CommonColor.normalGrey}
            />
          </TouchableOpacity>

          <View style={styles.composerWrap}>
            <Composer
              {...props}
              textInputStyle={styles.composerInput}
            />
          </View>

          {hasText ? (
            <Send
              {...props}
              alwaysShowSend={true}
              containerStyle={styles.sendContainer}
            >
              <View style={styles.sendIconButton}>
                <Icon name="arrow-up" size={21} color="#ffffff" />
              </View>
            </Send>
          ) : (
            <TouchableOpacity style={styles.inputSideButton} activeOpacity={0.78}>
              <Icon name="mic-outline" size={22} color={CommonColor.normalGrey} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCustomDay  = (props:any) => {
    // 从props中获取日期
    const { currentMessage } = props;
    const date = currentMessage.createdAt;

    // 自定义日期格式
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    return (
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Text style={{ color: 'gray' }}>{formattedDate}</Text>
      </View>
    );
  }


  const renderTime = () => null;

  return (
    <>
    <View style={styles.mainContent}>
      <ChatTopMenu name={params.name} jobTitle={params.jobTitle} />

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        showUserAvatar={true}
        locale={'zh-cn'}
        showAvatarForEveryMessage={true}
        renderBubble={renderBubble}
        placeholder={'输入消息'}
        textInputProps={{
          returnKeyType: 'send',
          placeholderTextColor: CommonColor.normalGrey,
        }}
        inverted={true}
        renderUsernameOnMessage={true}
        renderTime={renderTime}
        renderUsername={renderTime}
        renderInputToolbar={renderInputToolbar}
        minInputToolbarHeight={inputToolbarHeight}
        loadEarlier={hasEarlierMessages}
        isLoadingEarlier={loadingEarlier}
        onLoadEarlier={handleLoadEarlier}
        onInputTextChanged={setComposerText}
        user={{
          _id: currentMemberId || '0',
          avatar: avatar,
        }}
        alignTop={true}
      />
    </View>

    </>
  );
}
const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: CommonColor.tagBg,
  },
  inputToolbar: {
    borderTopWidth: 0,
    backgroundColor: CommonColor.tagBg,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  quickActionsContent: {
    paddingBottom: 9,
    gap: 8,
  },
  quickActionChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: CommonColor.line,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  quickActionText: {
    fontSize: 12,
    lineHeight: 17,
    color: CommonColor.fontColor,
    fontWeight: '500',
  },
  inputCapsule: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#f7f9fb',
    borderWidth: 1,
    borderColor: CommonColor.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  inputSideButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerWrap: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  composerInput: {
    minHeight: 36,
    maxHeight: 92,
    marginLeft: 2,
    marginRight: 2,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    fontSize: 14,
    lineHeight: 20,
    color: CommonColor.fontColor,
  },
  sendContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 0,
    marginBottom: 0,
  },
  sendIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CommonColor.mainColor,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
