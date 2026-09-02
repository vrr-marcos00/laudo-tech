package com.laudotech.util;

import java.util.Locale;

public final class TextUtils {
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private TextUtils() {}

    public static String upper(String value) {
        return value == null ? null : value.toUpperCase(PT_BR);
    }

    public static boolean isHtmlBlank(String html) {
        return html == null || html.replaceAll("<[^>]*>", "").isBlank();
    }
}
