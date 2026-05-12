package com.jptaxi.backend.api.controller;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jptaxi.backend.api.dto.driver.DriverSearchPageResponse;
import com.jptaxi.backend.domain.JapaneseLevel;
import com.jptaxi.backend.service.DriverSearchService;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/v1/drivers")
@Validated
public class DriverSearchController {

	private final DriverSearchService driverSearchService;

	public DriverSearchController(DriverSearchService driverSearchService) {
		this.driverSearchService = driverSearchService;
	}

	/**
	 * Tìm tài xế đã duyệt trong bán kính quanh điểm (lat, lng), có lọc theo loại xe,
	 * điểm đánh giá trung bình tối thiểu, trình độ tiếng Nhật tối thiểu, và độ “mới” của vị trí.
	 */
	@GetMapping("/search")
	public ResponseEntity<DriverSearchPageResponse> search(
			@RequestParam @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
			@RequestParam @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
			@RequestParam(defaultValue = "10.0") @Positive double radiusKm,
			@RequestParam(required = false) @Pattern(regexp = "4|7|9", message = "vehicleType phải là 4, 7 hoặc 9")
			String vehicleType,
			@RequestParam(required = false) @Min(1) @Max(5) Integer minRating,
			@RequestParam(required = false) String minJapaneseLevel,
			@RequestParam(defaultValue = "30") @Min(1) @Max(24 * 60) int maxLocationAgeMinutes,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

		Integer minJapaneseOrdinal = null;
		if (minJapaneseLevel != null && !minJapaneseLevel.isBlank()) {
			JapaneseLevel level = JapaneseLevel.fromCode(minJapaneseLevel.trim());
			minJapaneseOrdinal = level.getRank();
		}

		BigDecimal minRatingBd = null;
		if (minRating != null) {
			minRatingBd = BigDecimal.valueOf(minRating.longValue());
		}

		DriverSearchPageResponse body = driverSearchService.search(
				latitude.doubleValue(),
				longitude.doubleValue(),
				radiusKm,
				vehicleType,
				minRatingBd,
				minJapaneseOrdinal,
				maxLocationAgeMinutes,
				page,
				size);

		return ResponseEntity.ok(body);
	}
}
