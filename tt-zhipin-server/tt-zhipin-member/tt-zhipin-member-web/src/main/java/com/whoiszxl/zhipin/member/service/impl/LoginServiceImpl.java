package com.whoiszxl.zhipin.member.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.servlet.ServletUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.whoiszxl.zhipin.member.cqrs.command.SmsLoginCommand;
import com.whoiszxl.zhipin.member.entity.Member;
import com.whoiszxl.zhipin.member.service.ILoginService;
import com.whoiszxl.zhipin.member.service.IMemberService;
import com.whoiszxl.zhipin.tools.common.constants.RedisPrefixConstants;
import com.whoiszxl.zhipin.tools.common.enums.FlagEnum;
import com.whoiszxl.zhipin.tools.common.exception.ExceptionCatcher;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import com.whoiszxl.zhipin.tools.common.token.entity.AppLoginMember;
import com.whoiszxl.zhipin.tools.common.utils.IpUtils;
import com.whoiszxl.zhipin.tools.common.utils.MyServletUtil;
import com.whoiszxl.zhipin.tools.common.utils.RedisUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.concurrent.TimeUnit;

/**
 * <p>
 * 登录 服务实现类
 * </p>
 *
 * @author whoiszxl
 * @since 2023-08-04
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LoginServiceImpl implements ILoginService {

    @Value("${zhipin.sms.access-key-id}")
    private String accessKeyId;

    @Value("${zhipin.sms.access-key-secret}")
    private String accessKeySecret;

    @Value("${zhipin.sms.sign-name}")
    private String signName;

    @Value("${zhipin.sms.template-code}")
    private String templateCode;

    @Value("${zhipin.test-login.enabled:true}")
    private boolean testLoginEnabled;

    @Value("${zhipin.test-login.phone:12345678911,13800138000}")
    private String testLoginPhone;

    @Value("${zhipin.test-login.sms-code:1234}")
    private String testLoginSmsCode;

    @Value("${zhipin.test-login.uuid:test-login-uuid}")
    private String testLoginUuid;

    private final RedisUtils redisUtils;

    private final IMemberService memberService;

    private final TokenHelper tokenHelper;

    private void sendSms(String phone, String code) {
        try {
            com.aliyun.teaopenapi.models.Config config = new com.aliyun.teaopenapi.models.Config()
                    .setAccessKeyId(accessKeyId)
                    .setAccessKeySecret(accessKeySecret);
            config.endpoint = "dypnsapi.aliyuncs.com";
            com.aliyun.dypnsapi20170525.Client client = new com.aliyun.dypnsapi20170525.Client(config);

            com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest sendSmsVerifyCodeRequest = new com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest()
                    .setSignName(signName)
                    .setTemplateCode(templateCode)
                    .setPhoneNumber(phone)
                    .setTemplateParam("{\"code\":\"" + code + "\",\"min\":\"5\"}");
            com.aliyun.teautil.models.RuntimeOptions runtime = new com.aliyun.teautil.models.RuntimeOptions();
            com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeResponse response = client.sendSmsVerifyCodeWithOptions(sendSmsVerifyCodeRequest, runtime);
            if (response == null || response.getBody() == null || !"OK".equals(response.getBody().getCode())) {
                String errMsg = response != null && response.getBody() != null ? response.getBody().getMessage() : "未知错误";
                log.error("发送短信失败: {}", errMsg);
                ExceptionCatcher.catchServiceEx("发送短信失败: " + errMsg);
            }
        } catch (Exception e) {
            log.error("发送短信异常", e);
            ExceptionCatcher.catchServiceEx("发送短信系统异常: " + e.getMessage());
        }
    }

    @Override
    public String sendSmsCaptcha(String phone) {
        if(isTestLoginPhone(phone)) {
            return testLoginUuid;
        }

        // 从Redis中获取对应手机号的验证码信息
        String captchaKey = RedisPrefixConstants.format(RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS, phone);
        String captchaValue = redisUtils.get(captchaKey);

        // 判断是否是在120秒内重复发送
        if(StrUtil.isNotBlank(captchaValue)) {
            long ttl = Long.parseLong(captchaValue.split(RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS_SEPARATOR)[0]);
            if(DateUtil.currentSeconds() - ttl < RedisPrefixConstants.Member.SMS_TIMEOUT) {
                ExceptionCatcher.catchServiceEx("你发送得太快啦");
            }
        }

        // 生成验证码
        int smsCode = RandomUtil.randomInt(1000, 9999);
        String uuid = UUID.fastUUID().toString();
        String value = DateUtil.currentSeconds()
                + RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS_SEPARATOR
                + smsCode
                + RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS_SEPARATOR
                + uuid;

        // 将验证码保存到 Redis，有效期 10 分钟
        redisUtils.setEx(captchaKey, value, 10, TimeUnit.MINUTES);

        //3. 调用第三方平台发送短信
        this.sendSms(phone, String.valueOf(smsCode));

        //4. 返回结果
        return uuid;
    }

    @Override
    public String smsLogin(SmsLoginCommand command) {
        if(isValidTestLogin(command)) {
            return loginOrRegister(command.getPhone());
        }

        // 校验验证码是否正确
        String captchaKey = RedisPrefixConstants.format(RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS, command.getPhone());
        String captchaValue = redisUtils.get(captchaKey);
        if(StrUtil.isBlank(captchaValue)) {
            ExceptionCatcher.catchServiceEx("参数有误");
        }

        String[] valueParams = captchaValue.split(RedisPrefixConstants.Member.MEMBER_CAPTCHA_SMS_SEPARATOR);
        Assert.isTrue(valueParams.length == 3, "参数有误");
        Assert.isTrue(StrUtil.equals(command.getSmsCode(), valueParams[1]), "验证码输入错误");
        Assert.isTrue(StrUtil.equals(command.getUuid(), valueParams[2]), "UUID输入错误");

        // 如果用户已注册，则直接登录，未注册则进行注册
        Member member = memberService.getOne(Wrappers.<Member>lambdaQuery()
                .eq(Member::getPhone, command.getPhone()));

        if(member == null) {
            //进行注册
            member = new Member();
            member.setId(IdUtil.getSnowflakeNextId());
            member.setPhone(command.getPhone());

            HttpServletRequest request = MyServletUtil.getRequest();
            member.setIp(ServletUtil.getClientIP(request));
            member.setCity(IpUtils.getCityInfo(member.getIp()));
            memberService.save(member);
        }

        //进行登录
        AppLoginMember appLoginMember = BeanUtil.copyProperties(member, AppLoginMember.class);
        tokenHelper.appLogin(appLoginMember);

        //登录成功后删除验证码缓存
        redisUtils.delete(captchaKey);

        return StpUtil.getTokenValue();
    }

    private boolean isTestLoginPhone(String phone) {
        return testLoginEnabled
                && StrUtil.isNotBlank(phone)
                && StrUtil.splitTrim(testLoginPhone, StrUtil.C_COMMA).contains(phone);
    }

    private boolean isValidTestLogin(SmsLoginCommand command) {
        return command != null
                && isTestLoginPhone(command.getPhone())
                && StrUtil.equals(command.getSmsCode(), testLoginSmsCode)
                && StrUtil.equals(command.getUuid(), testLoginUuid);
    }

    private String loginOrRegister(String phone) {
        Member member = memberService.getOne(Wrappers.<Member>lambdaQuery()
                .eq(Member::getPhone, phone));

        if(member == null) {
            member = new Member();
            member.setId(IdUtil.getSnowflakeNextId());
            member.setPhone(phone);

            HttpServletRequest request = MyServletUtil.getRequest();
            member.setIp(ServletUtil.getClientIP(request));
            member.setCity(IpUtils.getCityInfo(member.getIp()));
            memberService.save(member);
        }

        AppLoginMember appLoginMember = BeanUtil.copyProperties(member, AppLoginMember.class);
        tokenHelper.appLogin(appLoginMember);

        return StpUtil.getTokenValue();
    }
}
