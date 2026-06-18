package com.whoiszxl.zhipin.member.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class LoginServiceImplTest {

    private static final String TEST_LOGIN_PHONES = "12345678910,12345678911,12345678912,12345678913,"
            + "12345678914,12345678915,12345678916,12345678917,12345678918,12345678919,"
            + "12345678920,13800138000";

    @Test
    void sendSmsCaptchaReturnsFixedUuidForTestPhoneWithoutExternalDependencies() {
        LoginServiceImpl loginService = new LoginServiceImpl(null, null, null);
        ReflectionTestUtils.setField(loginService, "testLoginEnabled", true);
        ReflectionTestUtils.setField(loginService, "testLoginPhone", TEST_LOGIN_PHONES);
        ReflectionTestUtils.setField(loginService, "testLoginUuid", "test-login-uuid");

        String uuid = loginService.sendSmsCaptcha("12345678911");

        assertThat(uuid).isEqualTo("test-login-uuid");
    }

    @Test
    void sendSmsCaptchaReturnsFixedUuidForValidLookingTestPhoneAlias() {
        LoginServiceImpl loginService = new LoginServiceImpl(null, null, null);
        ReflectionTestUtils.setField(loginService, "testLoginEnabled", true);
        ReflectionTestUtils.setField(loginService, "testLoginPhone", TEST_LOGIN_PHONES);
        ReflectionTestUtils.setField(loginService, "testLoginUuid", "test-login-uuid");

        String uuid = loginService.sendSmsCaptcha("13800138000");

        assertThat(uuid).isEqualTo("test-login-uuid");
    }

    @Test
    void sendSmsCaptchaReturnsFixedUuidForConfiguredTestPhoneRange() {
        LoginServiceImpl loginService = new LoginServiceImpl(null, null, null);
        ReflectionTestUtils.setField(loginService, "testLoginEnabled", true);
        ReflectionTestUtils.setField(loginService, "testLoginPhone", TEST_LOGIN_PHONES);
        ReflectionTestUtils.setField(loginService, "testLoginUuid", "test-login-uuid");

        for(long phone = 12345678910L; phone <= 12345678920L; phone++) {
            assertThat(loginService.sendSmsCaptcha(String.valueOf(phone))).isEqualTo("test-login-uuid");
        }
    }

    @Test
    void normalPhoneIsNotTreatedAsTestLoginPhone() {
        LoginServiceImpl loginService = new LoginServiceImpl(null, null, null);
        ReflectionTestUtils.setField(loginService, "testLoginEnabled", true);
        ReflectionTestUtils.setField(loginService, "testLoginPhone", TEST_LOGIN_PHONES);

        Boolean result = ReflectionTestUtils.invokeMethod(loginService, "isTestLoginPhone", "15080076842");

        assertThat(result).isFalse();
    }
}
