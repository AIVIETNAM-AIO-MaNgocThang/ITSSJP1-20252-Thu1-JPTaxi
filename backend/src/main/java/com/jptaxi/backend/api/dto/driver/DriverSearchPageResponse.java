package com.jptaxi.backend.api.dto.driver;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DriverSearchPageResponse(
		List<DriverSummaryDto> content,
		long totalElements,
		int page,
		int size,
		boolean empty,
		DriverSearchNotificationCode notificationCode,
		String messageJa,
		String messageVi) {

	/** Kết quả có ít nhất một tài xế trong DB (trên các trang); hoặc trang hiện tại vượt phạm vi. */
	public static DriverSearchPageResponse ofResults(
			List<DriverSummaryDto> content, long totalElements, int page, int size) {
		if (totalElements == 0) {
			throw new IllegalArgumentException("totalElements == 0: dùng ofEmptyReason");
		}
		boolean emptyPage = content.isEmpty();
		if (emptyPage) {
			return new DriverSearchPageResponse(
					content,
					totalElements,
					page,
					size,
					true,
					DriverSearchNotificationCode.PAGE_OUT_OF_RANGE,
					DriverSearchMessages.pageOutOfRangeJa(),
					DriverSearchMessages.pageOutOfRangeVi());
		}
		return new DriverSearchPageResponse(
				content,
				totalElements,
				page,
				size,
				false,
				DriverSearchNotificationCode.OK,
				null,
				null);
	}

	public static DriverSearchPageResponse ofEmptyReason(
			int page,
			int size,
			DriverSearchNotificationCode code,
			String messageJa,
			String messageVi) {
		return new DriverSearchPageResponse(
				List.of(),
				0L,
				page,
				size,
				true,
				code,
				messageJa,
				messageVi);
	}
}
