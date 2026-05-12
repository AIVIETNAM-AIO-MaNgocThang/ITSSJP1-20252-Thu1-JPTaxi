package com.jptaxi.backend.api.dto.driver;

/**
 * Lý do không có (hoặc không hiển thị) tài xế trong kết quả tìm kiếm.
 */
public enum DriverSearchNotificationCode {

	/** Có ít nhất một bản ghi trong {@code content} (trang hiện tại). */
	OK,

	/**
	 * Có tài xế thỏa điều kiện nhưng trang {@code page} vượt quá phạm vi (không có phần tử trên trang này).
	 */
	PAGE_OUT_OF_RANGE,

	/**
	 * Trong bán kính có tài xế đang hoạt động (vị trí mới, đã duyệt) nhưng bộ lọc hiện tại loại hết.
	 */
	NO_MATCH_FILTERS_TOO_STRICT,

	/** Có tài xế online nhưng không ai trong bán kính định vị. */
	NO_MATCH_OUT_OF_RADIUS,

	/** Không có tài xế đã duyệt với vị trí gần đây trong cửa sổ thời gian cho phép. */
	NO_MATCH_NO_ACTIVE_DRIVERS
}
