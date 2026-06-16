package com.whoiszxl.zhipin.im.util;

import com.whoiszxl.zhipin.im.pack.PrivateChatPack;
import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ImJsonUtilTest {

    @Test
    void shouldSerializeNestedLongIdsAsStringsForJsClients() {
        PrivateChatPack privateChatPack = PrivateChatPack.builder()
                .messageId("msg-1")
                .contentId("2066772875939147776")
                .fromMemberId(2066770067697303552L)
                .toMemberId(2066770447860629504L)
                .sequence(3L)
                .body("hello")
                .build();

        ChatMessage<PrivateChatPack> chatMessage = ChatMessage.<PrivateChatPack>builder()
                .toMemberId("2066770447860629504")
                .clientType((byte) 1)
                .command(2001)
                .imei("imei-1")
                .data(privateChatPack)
                .sendAt("2026-06-16 14:40:27")
                .ackStatus((byte) 1)
                .build();

        String json = ImJsonUtil.toClientJson(chatMessage);

        assertThat(json).contains("\"fromMemberId\":\"2066770067697303552\"");
        assertThat(json).contains("\"toMemberId\":\"2066770447860629504\"");
        assertThat(json).contains("\"sequence\":\"3\"");
        assertThat(json).contains("\"contentId\":\"2066772875939147776\"");
        assertThat(json).contains("\"command\":2001");
    }
}
