package com.jptaxi.backend.domain;

import java.util.Arrays;

/**
 * Thứ tự trình độ tiếng Nhật (thấp → cao), khớp {@code driver_japanese_level_enum}.
 */
public enum JapaneseLevel {
	N5(1),
	N4(2),
	N3(3),
	N2(4),
	N1(5),
	Native(6);

	private final int rank;

	JapaneseLevel(int rank) {
		this.rank = rank;
	}

	public int getRank() {
		return rank;
	}

	public static JapaneseLevel fromCode(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return Arrays.stream(values())
				.filter(e -> e.name().equalsIgnoreCase(value.trim()))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException(
						"minJapaneseLevel không hợp lệ: " + value));
	}
}
