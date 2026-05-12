package com.jptaxi.backend.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingRequest;
import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingResponse;
import com.jptaxi.backend.api.exception.RestExceptionHandler;
import com.jptaxi.backend.service.RideRequestConfirmService;

@WebMvcTest(RideRequestController.class)
@Import(RestExceptionHandler.class)
class RideRequestControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private RideRequestConfirmService rideRequestConfirmService;

	@Test
	void confirm_ok() throws Exception {
		when(rideRequestConfirmService.confirm(eq(12L), eq(3L), any()))
				.thenReturn(
						new ConfirmRideBookingResponse(
								12L,
								"pending",
								"searching",
								"予約を確定しました。",
								"Đã xác nhận đặt xe."));

		mockMvc.perform(
						post("/api/v1/ride-requests/12/confirm")
								.header("X-Customer-Id", "3")
								.contentType(MediaType.APPLICATION_JSON)
								.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.newStatus").value("searching"))
				.andExpect(jsonPath("$.requestId").value(12));
	}

	@Test
	void confirm_withBody_callsService() throws Exception {
		ConfirmRideBookingRequest body =
				new ConfirmRideBookingRequest("Nguyen A", "0901234567", "Heavy luggage");
		when(rideRequestConfirmService.confirm(eq(5L), eq(1L), any(ConfirmRideBookingRequest.class)))
				.thenReturn(
						new ConfirmRideBookingResponse(
								5L, "pending", "searching", "ja", "vi"));

		mockMvc.perform(
						post("/api/v1/ride-requests/5/confirm")
								.header("X-Customer-Id", "1")
								.contentType(MediaType.APPLICATION_JSON)
								.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk());
	}

	@Test
	void confirm_missingCustomerHeader_badRequest() throws Exception {
		mockMvc.perform(
						post("/api/v1/ride-requests/1/confirm")
								.contentType(MediaType.APPLICATION_JSON)
								.content("{}"))
				.andExpect(status().isBadRequest());
	}
}
