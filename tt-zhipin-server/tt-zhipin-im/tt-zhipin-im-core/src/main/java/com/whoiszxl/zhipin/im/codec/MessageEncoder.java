package com.whoiszxl.zhipin.im.codec;

import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.util.ImJsonUtil;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;

import java.nio.charset.StandardCharsets;

public class MessageEncoder extends MessageToByteEncoder {
    @Override
    protected void encode(ChannelHandlerContext ctx, Object msg, ByteBuf out) throws Exception {
        if(msg instanceof ChatMessage) {
            ChatMessage chatMessage = (ChatMessage) msg;
            String json = ImJsonUtil.toClientJson(chatMessage.getData());
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

            out.writeInt(chatMessage.getCommand());
            out.writeInt(bytes.length);
            out.writeBytes(bytes);
        }

    }
}
