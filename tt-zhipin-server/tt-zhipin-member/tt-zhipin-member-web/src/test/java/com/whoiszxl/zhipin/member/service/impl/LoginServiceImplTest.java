package com.whoiszxl.zhipin.member.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class LoginServiceImplTest {

    @Test
    void sendSmsCaptchaReturnsFixedUuidForTestPhoneWithoutExternalDependencies() {
        LoginServiceImpl loginService = new LoginServiceImpl(null, null, null);
        ReflectionTestUtils.setField(loginService, "testLoginEnabled", true);
        ReflectionTestUtils.setField(loginService, "testLoginPhone", "12345678911");
        ReflectionTestUtils.setField(loginService, "testLoginUuid", "test-login-uuid");

        String uuid = loginService.sendSmsCaptcha("12345678911");

        assertThat(uuid).isEqualTo("test-login-uuid");
    }
}
