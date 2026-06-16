package com.whoiszxl.zhipin.im.util;

import cn.hutool.json.JSONUtil;

import java.math.BigInteger;
import java.util.List;
import java.util.Map;

/**
 * JSON helpers for client-facing IM packets.
 */
public final class ImJsonUtil {

    private ImJsonUtil() {
    }

    public static String toClientJson(Object value) {
        Object json = JSONUtil.parse(value);
        return JSONUtil.toJsonStr(convertNumberToClientString(null, json));
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static Object convertNumberToClientString(Object key, Object value) {
        if (value == null) {
            return null;
        }

        if (shouldWriteAsString(key) && value instanceof Number) {
            return value.toString();
        }

        if (value instanceof Long || value instanceof BigInteger) {
            return value.toString();
        }

        if (value instanceof Map) {
            Map map = (Map) value;
            for (Object entryObject : map.entrySet()) {
                Map.Entry entry = (Map.Entry) entryObject;
                entry.setValue(convertNumberToClientString(entry.getKey(), entry.getValue()));
            }
            return map;
        }

        if (value instanceof List) {
            List list = (List) value;
            for (int i = 0; i < list.size(); i++) {
                list.set(i, convertNumberToClientString(null, list.get(i)));
            }
            return list;
        }

        return value;
    }

    private static boolean shouldWriteAsString(Object key) {
        if (key == null) {
            return false;
        }

        String fieldName = key.toString();
        return "id".equals(fieldName)
                || "sequence".equals(fieldName)
                || "readSequence".equals(fieldName)
                || fieldName.endsWith("Id")
                || fieldName.endsWith("ID")
                || fieldName.endsWith("Sequence");
    }
}
