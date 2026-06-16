package com.whoiszxl.zhipin.im.codec;

import com.whoiszxl.zhipin.im.protocol.ChatMessage;
import com.whoiszxl.zhipin.im.util.ImJsonUtil;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToMessageEncoder;
import io.netty.handler.codec.http.websocketx.BinaryWebSocketFrame;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * web socket 的编码器，需要将处理好的消息通过编码后写回到客户端
 * @author whoiszxl
 */
public class WebSocketEncoder extends MessageToMessageEncoder<ChatMessage> {

    @Override
    protected void encode(ChannelHandlerContext ctx, ChatMessage msg, List<Object> out) throws Exception {
        try {
            String s = ImJsonUtil.toClientJson(msg);
            byte[] bytes = s.getBytes(StandardCharsets.UTF_8);
            ByteBuf byteBuf = Unpooled.directBuffer(4 + bytes.length);
            byteBuf.writeInt(bytes.length);
            byteBuf.writeBytes(bytes);
            out.add(new BinaryWebSocketFrame(byteBuf));
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
