import React, { useState, useRef, useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, TextInput, StatusBar, Alert, ActivityIndicator } from "react-native";
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'

import { StackNavigationProp } from '@react-navigation/stack';

import icon_close from '../../assets/icons/close.png';
import MemberStore from "../../stores/MemberStore";
import { CommonColor } from "../../common/CommonColor";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import StorageUtil from "../../utils/StorageUtil";
import { CommonConstant } from "../../common/CommonConstant";
import { isMemberInfoComplete } from "../../utils/MemberInfoUtil";



//校验短信验证码页面
export default () => {
  
  const insets = useSafeAreaInsets();

  const {params} = useRoute<any>();
  const routeParams = params ?? {};

  const navigation = useNavigation<StackNavigationProp<any>>();


  const normalizedPhone = String(routeParams.phone ?? '').replace(/\D/g, '');
  const displayPhone = normalizedPhone.length === 11
    ? `${normalizedPhone.slice(0, 3)}****${normalizedPhone.slice(-4)}`
    : '您的手机';
  const [loginToken, setLoginToken] = useState<string>(String(routeParams.loginToken ?? ''));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);



  const input1Ref = useRef<TextInput | null>(null);
  const input2Ref = useRef<TextInput | null>(null);
  const input3Ref = useRef<TextInput | null>(null);
  const input4Ref = useRef<TextInput | null>(null);

  const [inputValues, setInputValues] = useState<string[]>(['', '', '', '']);
  const smsCode = inputValues.join('');
  const canLogin = smsCode.length === 4 && inputValues.every(Boolean) && !submitting;

  useEffect(() => {

  }, [])



  const handleTextChange = (text: string, inputIndex: number, nextInputRef: React.RefObject<TextInput | null>) => {
    const currentText = text.replace(/\D/g, '');
    const newInputValues = [...inputValues];
    newInputValues[inputIndex] = currentText.length === 1 ? currentText : '';
    setInputValues(newInputValues);

    if (currentText.length === 1 && nextInputRef.current) {
      nextInputRef.current.focus();
    }
  };

  const onPressByLogin = async () => {
    if (submitting) {
      return;
    }

    if (!normalizedPhone) {
      Alert.alert('手机号异常', '请返回重新输入手机号。');
      return;
    }

    if (!canLogin) {
      Alert.alert('请输入验证码', '请填写完整的 4 位短信验证码。');
      return;
    }

    setSubmitting(true);
    MemberStore.requestSmsLogin(normalizedPhone, smsCode, loginToken, (success: boolean, message?: string) => {
      setSubmitting(false);
      if(success) {
        MemberStore.requestMemberInfo((data?:MemberInfoEntity) => {
          console.log(data);
          if(data) {
            if(!isMemberInfoComplete(data)) {
                navigation.replace('InitMemberInfoPage', {memberInfo: data});
              }else {
                //将当前的用户信息保存到本地
                StorageUtil.setItem(CommonConstant.MEMBER_INFO, JSON.stringify(data));
                navigation.replace('TabPage');
              }
          }else if(data === undefined) {
            navigation.replace('LoginPage');
          }
        });
      }else {
        console.log("登录失败");
        Alert.alert('登录失败', message || '请确认验证码后重试。');
      }
    });
  }

  const onPressByResend = () => {
    if (!normalizedPhone) {
      Alert.alert('手机号异常', '请返回重新输入手机号。');
      return;
    }

    if (resending) {
      return;
    }

    setResending(true);
    MemberStore.requestSendSmsCaptcha(normalizedPhone, (success: boolean, message?: string) => {
      setResending(false);
      if (success) {
        setLoginToken(String(MemberStore.loginToken ?? ''));
        setInputValues(['', '', '', '']);
        input1Ref.current?.focus();
        Alert.alert('验证码已重新发送');
      } else {
        Alert.alert('验证码发送失败', message || '请稍后重试。');
      }
    });
  }

  return (
    <>
        {/** 隐藏状态栏 */}
    <StatusBar translucent backgroundColor={'transparent'} />
    
    <View style={[styles.root, {top: insets.top + 10}]}>
                        

        <View style={styles.root}>
  
          
          {/** 密码登录提示 */}
          <Text style={styles.phoneLoginTitle}>输入短信验证码</Text>
          <Text style={styles.phoneLoginSubTitle}>已经向您的手机 {displayPhone} 发送验证码</Text>

          <View style={styles.smsRoot}>
            <TextInput ref={input1Ref} style={styles.smsInput} keyboardType="numeric" maxLength={1}
                onChangeText={(text) => handleTextChange(text, 0, input2Ref)}
            />
            <TextInput ref={input2Ref} style={styles.smsInput} keyboardType="numeric" maxLength={1}
                onChangeText={(text) => handleTextChange(text, 1, input3Ref)}
            />
            <TextInput ref={input3Ref} style={styles.smsInput} keyboardType="numeric" maxLength={1}
                onChangeText={(text) => handleTextChange(text, 2, input4Ref)}
            />
            <TextInput ref={input4Ref} style={styles.smsInput} keyboardType="numeric" maxLength={1}
                onChangeText={(text) => handleTextChange(text, 3, input1Ref)}
            />
            </View>

          {/** 重新发送按钮 */}
          <View style={commonStyles.protocolLayout}>

            
            <TouchableOpacity onPress={onPressByResend} activeOpacity={0.7}>
              <Text style={commonStyles.labelText}>{resending ? '发送中...' : '重新发送'}</Text>
            </TouchableOpacity>

          </View>

          {/** 下一步按钮 */}
          <TouchableOpacity style={canLogin ? styles.loginButton : styles.unloginButton}
            activeOpacity={canLogin ? 0.7 : 1}
            disabled={submitting}
            onPress={onPressByLogin}>
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.loginText}>下一步</Text>}
          </TouchableOpacity>


          {/** 扩展功能 */}
          <View style={styles.changeLayout}>
            <Text style={styles.codeLoginText}>接收不到短信</Text>
          </View>

          {/** 关闭页面 */}
          <TouchableOpacity onPress={() => { navigation.canGoBack() ? navigation.goBack() : navigation.replace('LoginPage') }} style={styles.closeButtonLayout}>
            <Image style={styles.closeButtonIcon} source={icon_close}/>
          </TouchableOpacity>
          
      </View>
    </View>
    
    </>
  )
}


const styles = StyleSheet.create({
      root: {
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
      },

      phoneLoginTitle: {
        fontSize: 24,
        color: 'black',
        fontWeight: 'bold',
        marginTop: 54,
      },

      
      phoneLoginSubTitle: {
        fontSize: 12,
        color: CommonColor.deepGrey,
        marginTop: 10,
      },

      passwordTip: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
      },

      phoneInputLayout: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        marginTop: 15
      },

      phoneInputPre: {
        fontSize: 16,
        color: 'black',
      },
      phoneInputPreIcon:{
        width: 12,
        height: 6,
        marginLeft: 3,
      },

      phoneInput:{
        flex: 1,
        height: 50,
        backgroundColor: 'transparent',
        textAlign: 'left',
        textAlignVertical: 'center',
        fontSize: 16,
        marginLeft: 10,
        color: '#333'

      },
      passwordInputLayout: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginTop: 4,
      },
      passwordInput: {
        flex: 1,
        height: 40,
        backgroundColor: 'transparent',
        textAlign: 'left',
        textAlignVertical: 'center',
        fontSize: 16,
        marginRight: 16,
        color: '#333'
      },

      passwordEye: {
        width: 20,
        height: 20,
      },

      changeLayout: {
        width: '100%',
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
      },

      exchangeIcon: {
        width: 12,
        height: 12,
      },
      
      codeLoginText: {
        fontSize: 11,
        color: CommonColor.normalGrey,
        flex: 1,
        marginLeft: 4
      },

      forgetPasswordText: {
        fontSize: 12,
        color: '#303080',
      },

      loginButton: {
        width: '100%',
        height: 40,
        backgroundColor: CommonColor.mainColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10
      },

      unloginButton: {
        width: '100%',
        height: 40,
        backgroundColor: 'red',
        opacity: 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10
      },
      

      loginText: {
        fontSize: 13,
        color: 'white',
        fontWeight: 'bold'
      },

      thridPartyLoginLayout: {
        width: '100%',
        flexDirection: 'row',
        marginTop: 50,
        justifyContent: 'center'
      },

      icon_qq: {
        width: 56,
        height: 56,
      },
      icon_wx: {
        width: 56,
        height: 56,
        marginRight: 60
      },

      closeButtonLayout: {
        position: 'absolute',
        top: 5,
        left: 20,
      },

      closeButtonIcon: {
        width: 24,
        height: 24
      },


      bottomLoginMethods: {
        position: 'absolute',
        bottom: 50,
        right: 20,
        width: '100%',
      },

      bottomLoginMethodsRoot: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: "center",
      },

      bottomLoginTitle: {
        fontSize: 12
      },

      smsRoot: {
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },

      smsInput: {
        width: 60,
        height: 60,
        borderWidth: 0.5,
        borderColor: CommonColor.normalGrey,
        textAlign: 'center',
        fontSize: 25,
        fontWeight: "bold",
        marginHorizontal: 5,
      },

});

const commonStyles = StyleSheet.create({
    root: {
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        flexDirection: 'column',
        alignItems: 'center'
    },

    protocolLayout: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 15,
    },

    radioButton: {
      width: 20,
      height: 20,
    },

    labelText: {
      fontSize: 11,
      color: CommonColor.fontColor,
    },

    protocolText: {
      fontSize: 10,
      color: '#1020ff'
    },
})
