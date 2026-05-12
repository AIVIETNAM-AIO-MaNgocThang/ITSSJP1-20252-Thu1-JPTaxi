package com.jptaxi.backend.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingRequest;
import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingResponse;
import com.jptaxi.backend.service.RideRequestConfirmService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/v1/ride-requests")
@Validated
public class RideRequestController {

	private final RideRequestConfirmService rideRequestConfirmService;

	public RideRequestController(RideRequestConfirmService rideRequestConfirmService) {
		this.rideRequestConfirmService = rideRequestConfirmService;
	}

	/**
	 * Khách bấm「予約を確定する」: pending → searching; có thể kèm người đi thực / memo.
	 * MVP xác thực chủ yêu cầu qua header {@code X-Customer-Id} (sẽ thay bằng JWT sau).
	 */
	@PostMapping("/{requestId}/confirm")
	public ResponseEntity<ConfirmRideBookingResponse> confirm(
			@PathVariable @Positive long requestId,
			@RequestHeader("X-Customer-Id") @Positive long customerId,
			@RequestBody(required = false) @Valid ConfirmRideBookingRequest body) {

		ConfirmRideBookingResponse response =
				rideRequestConfirmService.confirm(requestId, customerId, body);
		return ResponseEntity.ok(response);
	}
}
