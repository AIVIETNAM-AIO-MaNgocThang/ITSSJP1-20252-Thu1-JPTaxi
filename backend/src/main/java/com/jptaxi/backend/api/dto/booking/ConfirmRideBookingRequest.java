package com.jptaxi.backend.api.dto.booking;

import jakarta.validation.constraints.Size;

/**
 * Dữ liệu gửi khi khách bấm「予約を確定する」(đặt hộ / memo).
 */
public record ConfirmRideBookingRequest(
		@Size(max = 50) String actualPassengerName,
		@Size(max = 15) String actualPassengerPhone,
		@Size(max = 255) String noteToDriver) {
}
