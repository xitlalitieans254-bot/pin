import React, { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, TextInput, LayoutAnimation, Alert, ActivityIndicator } from "react-native";
import { Linking } from "react-native";

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import icon_logo_main from '../../assets/images/logo_bg_transparent.png';
import icon_un_selection from '../../assets/icons/un_selection.png';
import icon_selection from '../../assets/icons/selection.png';

import icon_arrow from '../../assets/icons/arrow_left.png';
import icon_wx from '../../assets/icons/weixin.png';
import icon_apple from '../../assets/icons/apple.png';
import icon_phone from '../../assets/icons/phone.png';
import icon_qq from '../../assets/icons/qq.png';
import icon_triangle from '../../assets/icons/show_more.png';
import icon_close from '../../assets/icons/close.png';
import MemberStore from "../../stores/MemberStore";
import { CommonColor } from "../../common/CommonColor";

export default () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [loginType, setLoginType] = useState<'quick'|'input'>('input');
  const [check, setCheck] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const onPressByLogin =async () => {
    const normalizedPhone = phone.replace(/\D/g, '');
    if (sending) {
      return;
    }

    if (normalizedPhone.length !== 11) {
      Alert.alert('请输入正确的手机号', '手机号需要为 11 位数字。');
      return;
    }

    if (!check) {
      Alert.alert('请先同意协议', '勾选用户协议和隐私政策后才能继续。');
      return;
    }

    setSending(true);
    MemberStore.requestSendSmsCaptcha(normalizedPhone, (success: boolean, message?: string) => {
      setSending(false);
      if(success) {
        console.log("短信发送成功");
        console.log("MemberStore.loginToken: %s", MemberStore.loginToken);
        navigation.push('CheckSmsCaptchaPage', {loginToken: MemberStore.loginToken, phone: normalizedPhone});
      }else {
        console.log("短信发送失败");
        Alert.alert('验证码发送失败', message || '请检查网络后重试。');
      }
    });
  }


  const renderQuickLogin = () => {
    const styles = StyleSheet.create({
      root: {
        width: '100%',
        height: '100%',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        paddingHorizontal: 56,
      },

      otherLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
        marginBottom: 10,
      },

      otherLoginText: {
        color: '#303080',
        fontSize: 13
      },

      otherLoginIcon: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
        marginLeft: 6,
        transform: [{rotate: '180deg'}]
      },

      wxLoginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#05c160',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 10,
      },

      wxLoginIcon: {
        width: 26,
        height: 26
      },

      wxLoginText: {
        fontSize: 16,
        color: 'white',
        marginLeft: 8
      },

      appleLoginButton: {
        width: '100%',
        height: 50,
        backgroundColor: 'white',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        borderColor: 'black',
        borderWidth: 0.8,
        marginBottom: 10,
      },

      appleLoginIcon: {
        width: 26,
        height: 26
      },

      appleLoginText: {
        fontSize: 16,
        color: 'black',
        marginLeft: 8
      },

      qqLoginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#1296db',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 10,
      },

      qqLoginIcon: {
        width: 26,
        height: 26
      },

      qqLoginText: {
        fontSize: 16,
        color: 'white',
        marginLeft: 8
      },


      oneClickLoginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#0aa7a0',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 10,
      },

      oneClickLoginText: {
        fontSize: 16,
        color: 'white',
        marginLeft: 8
      },

      logo_main: {
        width: 180,
        height: 95,
        resizeMode: 'contain',
        position: 'absolute',
        top: 80,
      }




    });


    return (
      <View style={styles.root}>

        {/** 注册登录协议 */}
        <View style={commonStyles.protocolLayout}>
          
          <TouchableOpacity onPress={() => { setCheck(!check) }}>
            <Image style={commonStyles.radioButton} source={check ? icon_selection : icon_un_selection}/>
          </TouchableOpacity>

          <Text style={commonStyles.labelText}>我已阅读并同意</Text>
          <TouchableOpacity onPress={() => {
            Linking.openURL('https://www.google.com');
          }}>
            <Text style={commonStyles.protocolText}>《用户协议》和《隐私政策》</Text>
          </TouchableOpacity>
        </View>


        {/** 其他登录方式 */}
        <TouchableOpacity onPress={() => {
          LayoutAnimation.easeInEaseOut();
          setLoginType((type: 'quick'|'input') => {
            if(type === 'quick') {
              return 'input';
            }else {
              return 'quick';
            }
          } )
        }} style={styles.otherLoginButton}>
          <Text style={styles.otherLoginText}>其他登录方式</Text>
          <Image style={styles.otherLoginIcon} source={icon_arrow}/>
        </TouchableOpacity>

        {/** APPLE登录方式 */}
        <TouchableOpacity style={styles.appleLoginButton} activeOpacity={0.8}>
          <Image style={styles.appleLoginIcon} source={icon_apple}/>
          <Text style={styles.appleLoginText}>通过Apple登录</Text>
        </TouchableOpacity>

        {/** 微信登录方式 */}
        <TouchableOpacity style={styles.wxLoginButton} activeOpacity={0.8}>
          <Image style={styles.wxLoginIcon} source={icon_wx}/>
          <Text style={styles.wxLoginText}>微信登录</Text>
        </TouchableOpacity>

        {/** 微信登录方式 */}
        <TouchableOpacity style={styles.qqLoginButton} activeOpacity={0.8}>
          <Image style={styles.qqLoginIcon} source={icon_qq}/>
          <Text style={styles.qqLoginText}>QQ登录</Text>
        </TouchableOpacity>

        {/** 手机号登录方式 */}
        <TouchableOpacity style={styles.oneClickLoginButton} activeOpacity={0.8} onPress={() => {
          LayoutAnimation.easeInEaseOut();
          setLoginType((type: 'quick'|'input') => {
            if(type === 'quick') {
              return 'input';
            }else {
              return 'quick';
            }
          } )
        }}>
          <Image style={styles.wxLoginIcon} source={icon_phone}/>
          <Text style={styles.oneClickLoginText}>手机号登录</Text>
        </TouchableOpacity>


        {/** 登录LOGO */}
        <Image style={styles.logo_main} source={icon_logo_main}/>

      </View>
    );
  }

  const renderInputLogin = () => {
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
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7f8',
        borderRadius: 14,
        paddingHorizontal: 14,
        marginTop: 24
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
        height: 52,
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
        flexDirection: 'row'
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
        height: 48,
        backgroundColor: '#0aa7a0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        marginTop: 18
      },

      unloginButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#dce7e6',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        marginTop: 18
      },


      loginText: {
        fontSize: 15,
        color: 'white',
        fontWeight: '700'
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
      }

    });

    const canLogin = phone.replace(/\D/g, '').length === 11 && check && !sending;

    return (
      <View style={styles.root}>
          
          {/** 密码登录提示 */}
          <Text style={styles.phoneLoginTitle}>手机号登录/注册</Text>
          <Text style={styles.phoneLoginSubTitle}>首次验证通过即注册AI智聘账号</Text>


          {/** 登录手机号表单 */}
          <View style={styles.phoneInputLayout}>
            <Text style={styles.phoneInputPre}>+86</Text>
            <Image style={styles.phoneInputPreIcon} source={icon_triangle} />
            <TextInput style={styles.phoneInput} placeholderTextColor='#999' placeholder="请输入手机号" autoFocus={false}
               keyboardType="number-pad" maxLength={11} value={phone}
               onChangeText={(text:string) => {
                setPhone(text.replace(/\D/g, ''))
              }}/>

            <Icon color={CommonColor.transparentGreyBg} onPress={() => {setPhone('')}} name="close-circle" />

          </View>

          {/** 注册登录协议 */}
          <View style={commonStyles.protocolLayout}>
            
            <TouchableOpacity onPress={() => { setCheck(!check) }}>
              <Image style={commonStyles.radioButton} source={check ? icon_selection : icon_un_selection}/>
            </TouchableOpacity>

            <Text style={commonStyles.labelText}>已阅读并同意</Text>
            <TouchableOpacity onPress={() => {
              Linking.openURL('https://github.com/xitlalitieans254-bot/pin');
            }}>
              <Text style={commonStyles.protocolText}>《AI智聘用户协议》和《隐私政策》</Text>
            </TouchableOpacity>

          </View>

          {/** 下一步按钮 */}
          <TouchableOpacity style={canLogin ? styles.loginButton : styles.unloginButton}
            activeOpacity={canLogin ? 0.7 : 1}
            onPress={onPressByLogin}>
            {sending ? <ActivityIndicator color="white" /> : <Text style={styles.loginText}>下一步</Text>}
          </TouchableOpacity>


          {/** 扩展功能 */}
          <View style={styles.changeLayout}>
            <Text style={styles.codeLoginText}>接收不到短信</Text>
          </View>

          {/** 关闭页面 */}
          <TouchableOpacity onPress={() => {setLoginType('quick')}} style={styles.closeButtonLayout}>
            <Image style={styles.closeButtonIcon} source={icon_close}/>
          </TouchableOpacity>

          <View style={styles.bottomLoginMethods}>
            <View style={styles.bottomLoginMethodsRoot}>
              <Text style={styles.bottomLoginTitle}>或通过以下方式登录</Text>
              
              <View style={{flexDirection: "row", marginTop: 15}}>
                {/** APPLE登录方式 */}
                <TouchableOpacity activeOpacity={0.8}>
                  <FontAwesome size={28} color={CommonColor.fontColor} name="apple"/>
                </TouchableOpacity>

                {/** 微信登录方式 */}
                <TouchableOpacity style={{marginLeft: 20}} activeOpacity={0.8}>
                  <FontAwesome size={28} color={CommonColor.wxColor} name="weixin"/>
                </TouchableOpacity>
              </View>
              
              <View style={{flexDirection: "row", marginTop: 22}}>
                <Text style={[styles.bottomLoginTitle, {paddingLeft: 10}]}>服务热线</Text>
                <Text style={[styles.bottomLoginTitle, {paddingLeft: 10}]}>举报监督电话</Text>
                <Text style={[styles.bottomLoginTitle, {paddingLeft: 10}]}>资质证照</Text>
              </View>

            </View>
          </View>
          
      </View>
    );
  }

  return (
    <View style={commonStyles.root}>
        {
          loginType === 'quick' ? renderQuickLogin() : renderInputLogin()
        }
    </View>
  )
}


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
      fontSize: 10,
      color: '#999',
    },

    protocolText: {
      fontSize: 10,
      color: '#1020ff'
    },
})
