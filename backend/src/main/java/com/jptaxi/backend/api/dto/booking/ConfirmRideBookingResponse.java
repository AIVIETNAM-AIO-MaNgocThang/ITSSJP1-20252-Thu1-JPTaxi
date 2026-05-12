package com.jptaxi.backend.api.dto.booking;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConfirmRideBookingResponse(
		long requestId,
		String previousStatus,
		String newStatus,
		String messageJa,
		String messageVi) {
}
