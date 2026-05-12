package com.jptaxi.backend.api.dto.driver;

import java.math.BigDecimal;
import java.time.Instant;

public record DriverSummaryDto(
		long driverId,
		String firstName,
		String lastName,
		String avatarUrl,
		String vehicleType,
		String japaneseLevel,
		BigDecimal averageRating,
		long ratingCount,
		double distanceKm,
		double currentLatitude,
		double currentLongitude,
		Instant locationRecordedAt) {
}
