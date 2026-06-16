import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, LayoutAnimation, ScrollView, Alert } from "react-native";

import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonColor } from "../../../common/CommonColor";
import Icon from 'react-native-vector-icons/Ionicons';

import DatePicker from 'react-native-date-picker'
import { dateFormat } from "../../../utils/StrUtil";
import MemberStore from "../../../stores/MemberStore";

import { launchImageLibrary, ImagePickerResponse } from "react-native-image-picker";
import apis from "../../../apis/apis";
import { getMissingMemberInfoStep, InitMemberInfoStep } from "../../../utils/MemberInfoUtil";

const DEFAULT_BIRTHDAY = new Date(2000, 0, 1);
const WORK_STATUS_OPTIONS_BY_IDENTITY: Record<number, number[]> = {
  1: [5, 6, 7, 8],
  2: [1, 2, 3, 4],
};

const toNumberOption = (value: unknown, validOptions: number[]): number => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return validOptions.indexOf(numberValue) >= 0 ? numberValue : 0;
};

const toBirthdayDate = (value: unknown): Date => {
  if (typeof value !== 'string' || value.trim() === '') {
    return DEFAULT_BIRTHDAY;
  }

  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? DEFAULT_BIRTHDAY : parsedDate;
};

const isAtLeast16 = (birthday: Date): boolean => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  const dayDiff = today.getDate() - birthday.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 16;
};

//初始化用户信息页面
export default () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const {params} = useRoute<any>();
  const memberInfo = (params?.memberInfo || {}) as Partial<MemberInfoEntity>;
  const initialIdentityStatus = toNumberOption(memberInfo.identityStatus, [1, 2]);

  const [initType, setInitType] = useState<InitMemberInfoStep>(() => getMissingMemberInfoStep(memberInfo) || 'renderInitNameInfo');

  const [name, setName] = useState(typeof memberInfo.fullName === 'string' ? memberInfo.fullName : '');

  const [avatarUrl, setAvatarUrl] = useState(typeof memberInfo.avatar === 'string' ? memberInfo.avatar : '');


  const [date, setDate] = useState(() => toBirthdayDate(memberInfo.birthday));


  const [selectedButton, setSelectedButton] = useState(() => toNumberOption(memberInfo.gender, [1, 2]));
  const handleButtonPress = (buttonIndex: number) => {
    setSelectedButton(buttonIndex);
  };

  const [selectedButtonIdentityStatus, setSelectedButtonIdentityStatus] = useState(initialIdentityStatus);
  const handleIdentityStatusButtonPress = (buttonIndex: number) => {
    setSelectedButtonIdentityStatus(buttonIndex);
    setWorkStatus((currentWorkStatus) => (
      WORK_STATUS_OPTIONS_BY_IDENTITY[buttonIndex].indexOf(currentWorkStatus) >= 0 ? currentWorkStatus : 0
    ));
  };


  const [workStatus, setWorkStatus] = useState(() => {
    if (!initialIdentityStatus) {
      return 0;
    }

    return toNumberOption(memberInfo.workStatus, WORK_STATUS_OPTIONS_BY_IDENTITY[initialIdentityStatus]);
  });
  const handleWorkStatusButtonPress = (buttonIndex: any) => {
    setWorkStatus(buttonIndex);
  };

  
  const [highestQualification, setHighestQualification] = useState(() => toNumberOption(memberInfo.highestQualification, [1, 2, 3, 4, 5, 6]));
  const handleHighestQualificationButtonPress = (buttonIndex: any) => {
    setHighestQualification(buttonIndex);
  };


  const [highestQualificationType, setHighestQualificationType] = useState(() => toNumberOption(memberInfo.highestQualificationType, [1, 2]));
  const handleHighestQualificationTypeButtonPress = (buttonIndex: any) => {
    setHighestQualificationType(buttonIndex);
  };


  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleImagePress = (index:number, image:string) => {
    setSelectedImageIndex(index);
    setAvatarUrl(image);
  };


  useEffect(() => {
    setInitType(getMissingMemberInfoStep(memberInfo) || 'renderInitNameInfo');
  }, []);

  const showSaveError = (message?: string) => {
    Alert.alert('保存失败', message || '请稍后重试');
  };

  const submitBaseInfo = () => {
    if (submitting) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('请填写姓名');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('姓名至少填写 2 个字');
      return;
    }

    if (!selectedButton) {
      Alert.alert('请选择性别');
      return;
    }

    if (!isAtLeast16(date)) {
      Alert.alert('请确认出生年月', '根据平台规则，需要年满 16 周岁才能注册使用。');
      return;
    }

    setSubmitting(true);
    MemberStore.initBaseInfo(trimmedName, selectedButton, dateFormat(date), (success, message) => {
      setSubmitting(false);
      if(success) {
        setName(trimmedName);
        LayoutAnimation.easeInEaseOut();
        setInitType('renderInitStatusInfo');
      } else {
        showSaveError(message);
      }
    });
  };

  const submitIdentityInfo = () => {
    if (submitting) {
      return;
    }

    if (!selectedButtonIdentityStatus) {
      Alert.alert('请选择你的身份');
      return;
    }

    const validWorkStatusOptions = WORK_STATUS_OPTIONS_BY_IDENTITY[selectedButtonIdentityStatus] || [];
    if (validWorkStatusOptions.indexOf(workStatus) < 0) {
      Alert.alert('请选择求职状态');
      return;
    }

    setSubmitting(true);
    MemberStore.initIdentityInfo(selectedButtonIdentityStatus, workStatus, (success, message) => {
      setSubmitting(false);
      if(success) {
        LayoutAnimation.easeInEaseOut();
        setInitType('renderInitQualification');
      } else {
        showSaveError(message);
      }
    });
  };

  const submitQualificationInfo = () => {
    if (submitting) {
      return;
    }

    if (!highestQualification) {
      Alert.alert('请选择最高学历');
      return;
    }

    if (!highestQualificationType) {
      Alert.alert('请选择学历类型');
      return;
    }

    setSubmitting(true);
    MemberStore.initQualificationInfo(highestQualification, highestQualificationType, (success, message) => {
      setSubmitting(false);
      if(success) {
        LayoutAnimation.easeInEaseOut();
        setInitType('renderInitAvatar');
      } else {
        showSaveError(message);
      }
    });
  };

  const submitAvatarInfo = () => {
    if (submitting || uploadingAvatar) {
      return;
    }

    if (!avatarUrl) {
      Alert.alert('请选择头像');
      return;
    }

    setSubmitting(true);
    MemberStore.initAvatar(avatarUrl, (success, message) => {
      setSubmitting(false);
      if(success) {
        LayoutAnimation.easeInEaseOut();
        navigation.replace('TabPage');
      } else {
        showSaveError(message);
      }
    });
  };


  const renderInitNameInfo = () => {
    
    const styles = StyleSheet.create({
        root: {
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          paddingHorizontal: 20,
        },
  
        title: {
          fontSize: 24,
          color: 'black',
          fontWeight: 'bold',
          marginTop: 54,
        },
  
        nameInputLayout: {
          width: '100%',
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderBottomColor: '#ddd',
          borderRadius: 5,
          marginTop: 15,
          borderColor: CommonColor.normalGrey
        },
  
        phoneInputPre: {
          fontSize: 16,
          color: 'black',
        },
  
        nameInput:{
          flex: 1,
          height: 50,
          backgroundColor: 'transparent',
          textAlign: 'left',
          textAlignVertical: 'center',
          fontSize: 16,
          marginLeft: 10,
          color: '#333'
  
        },

        nextButton: {
          width: '100%',
          height: 40,
          backgroundColor: CommonColor.mainColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginTop: 30
        },
        disabledButton: {
          opacity: 0.5,
        },
  
        nextButtonText: {
          fontSize: 13,
          color: 'white',
          fontWeight: 'bold'
        },
  
        closeButtonLayout: {
          position: 'absolute',
          top: 5,
          left: 20,
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

        genderCheckLayout: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 0,
            marginTop: 20,
          },
          button: {
            flex: 1,
            backgroundColor: CommonColor.tagBg,
            borderRadius: 5,
            paddingVertical: 10,
            alignItems: 'center',
          },
          selectedButton: {
            backgroundColor: CommonColor.transparentMainColor,
            borderWidth: 1,
            borderColor: CommonColor.mainColor,
            
          },
          buttonText: {
            color: 'black',
          },
          selectedText: {
            color: CommonColor.mainColor
          },
  
      });
    
      return (
        <View style={styles.root}>
            
            <Text style={styles.title}>你的姓名</Text>
  
            <View style={styles.nameInputLayout}>
              <TextInput style={styles.nameInput} placeholderTextColor='#999' placeholder="请输入你的姓名" autoFocus={false}
                maxLength={13} value={name} 
                 onChangeText={(text:string) => {
                  setName(text)
                }}/>
  
              <Icon size={18} onPress={() => {setName('')}} color={CommonColor.transparentGreyBg} style={{paddingRight: 10}} name="close-circle" />
  
            </View>

            <Text style={styles.title}>性别</Text>

            <View style={styles.genderCheckLayout}>

                <TouchableOpacity style={[styles.button, selectedButton === 1 ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress(1)} >
                    <Text style={[styles.buttonText, selectedButton === 1 ? styles.selectedText : null]}>
                        男
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, {marginLeft: 20}, selectedButton === 2 ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress(2)}>
                    <Text style={[styles.buttonText, selectedButton === 2 ? styles.selectedText : null]}>
                        女
                    </Text>
                </TouchableOpacity>

            </View>

            <Text style={styles.title}>出生年月</Text>
            
            <DatePicker mode="date" date={date} onDateChange={setDate} />
            

  
            {/** 下一步按钮 */}
            <TouchableOpacity
              style={[styles.nextButton, submitting ? styles.disabledButton : null]}
              activeOpacity={submitting ? 1 : 0.8}
              disabled={submitting}
              onPress={submitBaseInfo}>
              <Text style={styles.nextButtonText}>{submitting ? '保存中...' : '下一步'}</Text>
            </TouchableOpacity>
  
  
            {/** 关闭页面 */}
            <TouchableOpacity onPress={() => {setInitType('renderInitNameInfo')}} style={styles.closeButtonLayout}>
              <Icon size={20} name="close"/>
            </TouchableOpacity>
  
            <View style={styles.bottomLoginMethods}>
              <View style={styles.bottomLoginMethodsRoot}>
                <Text style={styles.bottomLoginTitle}>根据《劳动法》《未成年人保护法》等相关法律规定申请注册AI智聘，请选择与你身份证一致的真实年龄并确保你已年满16周岁。</Text>
              </View>
            </View>
            
        </View>
      );
  }

  const renderInitStatusInfo = () => {
    const styles = StyleSheet.create({
        root: {
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          paddingHorizontal: 20,
        },
  
        title: {
          fontSize: 24,
          color: 'black',
          fontWeight: 'bold',
          marginTop: 54,
        },
  
        nameInputLayout: {
          width: '100%',
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderBottomColor: '#ddd',
          borderRadius: 5,
          marginTop: 15,
          borderColor: CommonColor.normalGrey
        },
  
        phoneInputPre: {
          fontSize: 16,
          color: 'black',
        },
  
        nameInput:{
          flex: 1,
          height: 50,
          backgroundColor: 'transparent',
          textAlign: 'left',
          textAlignVertical: 'center',
          fontSize: 16,
          marginLeft: 10,
          color: '#333'
  
        },

        nextButton: {
          width: '100%',
          height: 40,
          backgroundColor: CommonColor.mainColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginTop: 170
        },
        disabledButton: {
          opacity: 0.5,
        },
  
        nextButtonText: {
          fontSize: 13,
          color: 'white',
          fontWeight: 'bold'
        },
  
        closeButtonLayout: {
          position: 'absolute',
          top: 5,
          left: 20,
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

        genderCheckLayout: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 0,
            marginTop: 20,
          },
          button: {
            flex: 1,
            borderWidth: 1,
            backgroundColor: CommonColor.tagBg,
            borderColor: CommonColor.tagBg,
            borderRadius: 5,
            paddingVertical: 10,
            alignItems: 'center',
          },
          selectedButton: {
            backgroundColor: CommonColor.transparentMainColor,
            borderWidth: 1,
            borderColor: CommonColor.mainColor,
            
          },
          buttonText: {
            color: 'black',
          },
          selectedText: {
            color: CommonColor.mainColor
          },
  
      });
    
      return (
        <View style={styles.root}>
            
            <Text style={styles.title}>你的身份</Text>
  
            <View style={styles.genderCheckLayout}>

                <TouchableOpacity style={[styles.button, selectedButtonIdentityStatus === 1 ? styles.selectedButton : null]}
                    onPress={() => handleIdentityStatusButtonPress(1)} >
                    <Text style={[styles.buttonText, selectedButtonIdentityStatus === 1 ? styles.selectedText : null]}>
                        职场人
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, {marginLeft: 20}, selectedButtonIdentityStatus === 2 ? styles.selectedButton : null]}
                    onPress={() => handleIdentityStatusButtonPress(2)}>
                    <Text style={[styles.buttonText, selectedButtonIdentityStatus === 2 ? styles.selectedText : null]}>
                        学生
                    </Text>
                </TouchableOpacity>

            </View>

            <Text style={styles.title}>求职状态</Text>
            
            {
                selectedButtonIdentityStatus === 2 && (
                    <View style={styles.genderCheckLayout}>

                        <TouchableOpacity style={[styles.button, workStatus === 1 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(1)} >
                            <Text style={[styles.buttonText, workStatus === 1 ? styles.selectedText : null]}>
                                离校-随时到岗
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, {marginLeft: 20}, workStatus === 2 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(2)}>
                            <Text style={[styles.buttonText, workStatus === 2 ? styles.selectedText : null]}>
                                在校-月内到岗
                            </Text>
                        </TouchableOpacity>

                    </View>
                )
            }

            {
                selectedButtonIdentityStatus === 2 && (
                    <View style={styles.genderCheckLayout}>

                        <TouchableOpacity style={[styles.button, workStatus === 3 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(3)} >
                            <Text style={[styles.buttonText, workStatus === 3 ? styles.selectedText : null]}>
                                在校-考虑机会
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, {marginLeft: 20}, workStatus === 4 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(4)}>
                            <Text style={[styles.buttonText, workStatus === 4 ? styles.selectedText : null]}>
                                在校-暂不考虑
                            </Text>
                        </TouchableOpacity>

                    </View>
                )
            }

            

            {
                selectedButtonIdentityStatus === 1 && (
                    <View style={styles.genderCheckLayout}>

                    <TouchableOpacity style={[styles.button, workStatus === 5 ? styles.selectedButton : null]}
                        onPress={() => handleWorkStatusButtonPress(5)} >
                        <Text style={[styles.buttonText, workStatus === 5 ? styles.selectedText : null]}>
                            离职-随时到岗
                        </Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity style={[styles.button, {marginLeft: 20}, workStatus === 6 ? styles.selectedButton : null]}
                        onPress={() => handleWorkStatusButtonPress(6)}>
                        <Text style={[styles.buttonText, workStatus === 6 ? styles.selectedText : null]}>
                            在职-月内到岗
                        </Text>
                    </TouchableOpacity>
    
                </View>
                )
            }

            {
                selectedButtonIdentityStatus === 1 && (
                    <View style={styles.genderCheckLayout}>

                        <TouchableOpacity style={[styles.button, workStatus === 7 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(7)} >
                            <Text style={[styles.buttonText, workStatus === 7 ? styles.selectedText : null]}>
                                在职-考虑机会
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, {marginLeft: 20}, workStatus === 8 ? styles.selectedButton : null]}
                            onPress={() => handleWorkStatusButtonPress(8)}>
                            <Text style={[styles.buttonText, workStatus === 8 ? styles.selectedText : null]}>
                                在职-暂不考虑
                            </Text>
                        </TouchableOpacity>

                    </View>
                )
            }
  
            {/** 下一步按钮 */}
            <TouchableOpacity
              style={[styles.nextButton, submitting ? styles.disabledButton : null]}
              activeOpacity={submitting ? 1 : 0.8}
              disabled={submitting}
              onPress={submitIdentityInfo}>
              <Text style={styles.nextButtonText}>{submitting ? '保存中...' : '下一步'}</Text>
            </TouchableOpacity>
  
  
            {/** 关闭页面 */}
            <TouchableOpacity onPress={() => {setInitType('renderInitNameInfo')}} style={styles.closeButtonLayout}>
              <Icon size={20} name="close"/>
            </TouchableOpacity>
  
            <View style={styles.bottomLoginMethods}>
              <View style={styles.bottomLoginMethodsRoot}>
                <Text style={styles.bottomLoginTitle}>根据《劳动法》《未成年人保护法》等相关法律规定申请注册AI智聘，请选择与你身份证一致的真实年龄并确保你已年满16周岁。</Text>
              </View>
            </View>
            
        </View>
      );
  }

  const renderInitQualification = () => {
    const styles = StyleSheet.create({
        root: {
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          paddingHorizontal: 20,
        },
  
        title: {
          fontSize: 24,
          color: 'black',
          fontWeight: 'bold',
          marginTop: 54,
        },
  
        nameInputLayout: {
          width: '100%',
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderBottomColor: '#ddd',
          borderRadius: 5,
          marginTop: 15,
          borderColor: CommonColor.normalGrey
        },
  
        phoneInputPre: {
          fontSize: 16,
          color: 'black',
        },
  
        nameInput:{
          flex: 1,
          height: 50,
          backgroundColor: 'transparent',
          textAlign: 'left',
          textAlignVertical: 'center',
          fontSize: 16,
          marginLeft: 10,
          color: '#333'
  
        },

        nextButton: {
          width: '100%',
          height: 40,
          backgroundColor: CommonColor.mainColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginTop: 170
        },
        disabledButton: {
          opacity: 0.5,
        },
  
        nextButtonText: {
          fontSize: 13,
          color: 'white',
          fontWeight: 'bold'
        },
  
        closeButtonLayout: {
          position: 'absolute',
          top: 5,
          left: 20,
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

        genderCheckLayout: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 0,
            marginTop: 20,
          },
          button: {
            flex: 1,
            borderWidth: 1,
            backgroundColor: CommonColor.tagBg,
            borderColor: CommonColor.tagBg,
            borderRadius: 5,
            paddingVertical: 10,
            alignItems: 'center',
          },
          selectedButton: {
            backgroundColor: CommonColor.transparentMainColor,
            borderWidth: 1,
            borderColor: CommonColor.mainColor,
            
          },
          buttonText: {
            color: 'black',
          },
          selectedText: {
            color: CommonColor.mainColor
          },
  
      });
    
      return (
        <View style={styles.root}>
            
            

            <Text style={styles.title}>最高学历</Text>
            
           
                <View style={styles.genderCheckLayout}>

                    <TouchableOpacity style={[styles.button, highestQualification === 1 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(1)} >
                        <Text style={[styles.buttonText, highestQualification === 1 ? styles.selectedText : null]}>
                            初中及以下
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, {marginLeft: 20}, highestQualification === 2 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(2)}>
                        <Text style={[styles.buttonText, highestQualification === 2 ? styles.selectedText : null]}>
                            高中
                        </Text>
                    </TouchableOpacity>

                </View>

                <View style={styles.genderCheckLayout}>
                    <TouchableOpacity style={[styles.button, highestQualification === 3 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(3)} >
                        <Text style={[styles.buttonText, highestQualification === 3 ? styles.selectedText : null]}>
                            大专
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, {marginLeft: 20}, highestQualification === 4 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(4)}>
                        <Text style={[styles.buttonText, highestQualification === 4 ? styles.selectedText : null]}>
                            本科
                        </Text>
                    </TouchableOpacity>
                </View>
  

        
                <View style={styles.genderCheckLayout}>
                    <TouchableOpacity style={[styles.button, highestQualification === 5 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(5)} >
                        <Text style={[styles.buttonText, highestQualification === 5 ? styles.selectedText : null]}>
                            硕士
                        </Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity style={[styles.button, {marginLeft: 20}, highestQualification === 6 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationButtonPress(6)}>
                        <Text style={[styles.buttonText, highestQualification === 6 ? styles.selectedText : null]}>
                            博士    
                        </Text>
                    </TouchableOpacity>
                </View>


                <Text style={styles.title}>类型</Text>
  
                <View style={styles.genderCheckLayout}>

                    <TouchableOpacity style={[styles.button, highestQualificationType === 1 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationTypeButtonPress(1)} >
                        <Text style={[styles.buttonText, highestQualificationType === 1 ? styles.selectedText : null]}>
                            全日制
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, {marginLeft: 20}, highestQualificationType === 2 ? styles.selectedButton : null]}
                        onPress={() => handleHighestQualificationTypeButtonPress(2)}>
                        <Text style={[styles.buttonText, highestQualificationType === 2 ? styles.selectedText : null]}>
                            非全日制
                        </Text>
                    </TouchableOpacity>

                </View>
    
            {/** 下一步按钮 */}
            <TouchableOpacity
              style={[styles.nextButton, submitting ? styles.disabledButton : null]}
              activeOpacity={submitting ? 1 : 0.8}
              disabled={submitting}
              onPress={submitQualificationInfo}>
              <Text style={styles.nextButtonText}>{submitting ? '保存中...' : '下一步'}</Text>
            </TouchableOpacity>
  
  
            {/** 关闭页面 */}
            <TouchableOpacity onPress={() => {setInitType('renderInitNameInfo')}} style={styles.closeButtonLayout}>
              <Icon size={20} name="close"/>
            </TouchableOpacity>
  
            <View style={styles.bottomLoginMethods}>
              <View style={styles.bottomLoginMethodsRoot}>
                <Text style={styles.bottomLoginTitle}>根据《劳动法》《未成年人保护法》等相关法律规定申请注册AI智聘，请选择与你身份证一致的真实年龄并确保你已年满16周岁。</Text>
              </View>
            </View>
            
        </View>
      );
  }


  
  const onUploadPress = () => {
    if (uploadingAvatar || submitting) {
        return;
    }

    launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: false
    }, async (res: ImagePickerResponse) => {
        if (res.didCancel) {
            return;
        }

        if (res.errorMessage) {
            Alert.alert('选择头像失败', res.errorMessage);
            return;
        }

        const {assets} = res;
        if(!assets?.length) {
            Alert.alert('选择头像失败');
            return;
        }

        const {uri, fileName, type} = assets[0];
        if (!uri || !fileName || !type) {
            Alert.alert('选择头像失败', '图片信息不完整，请重新选择。');
            return;
        }

        setUploadingAvatar(true);
        try {
            let uploadedUrl = '';
            await MemberStore.uploadAvatar(apis.fileUpload.url, uri, fileName, type, (url:string) => {
                uploadedUrl = url;
            });

            if (uploadedUrl) {
                setSelectedImageIndex(-1);
                setAvatarUrl(uploadedUrl);
            } else {
                Alert.alert('头像上传失败', '请稍后重试。');
            }
        } finally {
            setUploadingAvatar(false);
        }

    });
  }



  const renderInitAvatar = () => {
    const styles = StyleSheet.create({
        root: {
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          paddingHorizontal: 20,
        },
  
        title: {
          fontSize: 24,
          color: 'black',
          fontWeight: 'bold',
          marginTop: 54,
        },

        tips1: {
            fontSize: 12,
            color: CommonColor.deepGrey,
            fontWeight: 'bold',
            marginTop: 10,
        },

        tips2: {
            fontSize: 13,
            color: CommonColor.deepGrey,
            fontWeight: '400',
            marginTop: 120,
        },
  
        nameInputLayout: {
          width: '100%',
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderBottomColor: '#ddd',
          borderRadius: 5,
          marginTop: 15,
          borderColor: CommonColor.normalGrey
        },
  
        phoneInputPre: {
          fontSize: 16,
          color: 'black',
        },
  
        nameInput:{
          flex: 1,
          height: 50,
          backgroundColor: 'transparent',
          textAlign: 'left',
          textAlignVertical: 'center',
          fontSize: 16,
          marginLeft: 10,
          color: '#333'
  
        },

        nextButton: {
          width: '100%',
          height: 40,
          backgroundColor: CommonColor.mainColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginTop: 170
        },

        
        unNextButton: {
            width: '100%',
            height: 40,
            backgroundColor: CommonColor.mainColor,
            opacity: 0.4,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            marginTop: 170
        },
  
        nextButtonText: {
          fontSize: 15,
          color: 'white',
          fontWeight: 'bold'
        },
  
        closeButtonLayout: {
          position: 'absolute',
          top: 5,
          left: 20,
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

        genderCheckLayout: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 0,
            marginTop: 20,
          },
          button: {
            flex: 1,
            borderWidth: 1,
            backgroundColor: CommonColor.tagBg,
            borderColor: CommonColor.tagBg,
            borderRadius: 5,
            paddingVertical: 10,
            alignItems: 'center',
          },
          selectedButton: {
            backgroundColor: CommonColor.transparentMainColor,
            borderWidth: 1,
            borderColor: CommonColor.mainColor,
            
          },
          buttonText: {
            color: 'black',
          },
          selectedText: {
            color: CommonColor.mainColor
          },


          uploadButton: {
            paddingTop: 100,
            justifyContent: 'center',
            alignItems: 'center',
          },
          circle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: CommonColor.mainColor,
            justifyContent: 'center',
            alignItems: 'center',
          },
          uploadText: {
            fontSize: 10,
            color: 'white',
          },




          avatarChooseContainer: {
            marginTop: 10,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
          },
          avatarContainer: {
            width: '18%', // 每行显示四张图片
            aspectRatio: 1, // 保持图片宽高比为 1:1
            marginHorizontal: 10,
            borderRadius: 100, // 圆角框
            overflow: 'hidden', // 防止内容超出圆角框
            borderWidth: 2,
            borderColor: 'transparent',
          },
          avatarImage: {
            width: '100%',
            height: '100%',
          },

          selectedImageContainer: {
            borderColor: CommonColor.mainColor, // 选中时的边框颜色
          },
  
      });
      
      const avatarImages = [
        'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default1.png',
        'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default2.png',
        'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default3.png',
        'https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default4.png',
      ];
      const isAvatarSubmitDisabled = !avatarUrl || submitting || uploadingAvatar;

      return (
        <View style={styles.root}>

            <View style={styles.uploadButton}>
                <TouchableOpacity
                    style={styles.circle}
                    activeOpacity={uploadingAvatar || submitting ? 1 : 0.8}
                    disabled={uploadingAvatar || submitting}
                    onPress={onUploadPress}>
                    {
                    avatarUrl === '' ? (
                    <>
                        <Icon name="camera" size={40} color="white" />
                        <Text style={styles.uploadText}>{uploadingAvatar ? '上传中...' : '点击上传'}</Text>
                    </>) : <Image style={{width: '100%', height: '100%', borderRadius: 100}} source={{uri: avatarUrl}} />
                    }
                </TouchableOpacity>
            </View>
            
            <Text style={styles.title}>最后一步，添加头像</Text>
            <Text style={styles.tips1}>上传头像，让头头们快速看到你</Text>
            <Text style={styles.tips2}>也可以选择下方虚拟头像</Text>

            <ScrollView contentContainerStyle={styles.avatarChooseContainer}>
                {avatarImages.map((image, index) => (
                    <TouchableOpacity
                        activeOpacity={1}
                        key={index}
                        style={[
                        styles.avatarContainer,
                        selectedImageIndex === index ? styles.selectedImageContainer : null,
                    ]}
                    onPress={() => handleImagePress(index, image)}
                    >
                    <Image source={{uri: image}} style={styles.avatarImage} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
  
  
            {/** 关闭页面 */}
            <TouchableOpacity onPress={() => {setInitType('renderInitNameInfo')}} style={styles.closeButtonLayout}>
              <Icon size={20} name="close"/>
            </TouchableOpacity>
  
            <View style={styles.bottomLoginMethods}>
                {/** 下一步按钮 */}
                <TouchableOpacity
                style={isAvatarSubmitDisabled ? styles.unNextButton : styles.nextButton}
                activeOpacity={isAvatarSubmitDisabled ? 1 : 0.8}
                disabled={isAvatarSubmitDisabled}
                onPress={submitAvatarInfo}>
                <Text style={styles.nextButtonText}>
                    {submitting ? '保存中...' : uploadingAvatar ? '上传中...' : '开启打工之旅'}
                </Text>
                </TouchableOpacity>
            </View>
            
        </View>
      );
  }
  



  return (
    <View style={styles.root}>
        {

            (
                initType === 'renderInitNameInfo' ? renderInitNameInfo() : (
                    initType === 'renderInitStatusInfo' ? renderInitStatusInfo() : (
                        initType === 'renderInitQualification' ? renderInitQualification() : renderInitAvatar()
                    )
                )
            )
        }
    </View>
  )
}


const styles = StyleSheet.create({
    root: {
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        flexDirection: 'column',
        alignItems: 'center'
    },

})

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
