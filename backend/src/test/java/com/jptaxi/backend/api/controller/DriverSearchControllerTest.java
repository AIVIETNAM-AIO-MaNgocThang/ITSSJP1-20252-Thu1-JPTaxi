package com.jptaxi.backend.api.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jptaxi.backend.api.dto.driver.DriverSearchMessages;
import com.jptaxi.backend.api.dto.driver.DriverSearchNotificationCode;
import com.jptaxi.backend.api.dto.driver.DriverSearchPageResponse;
import com.jptaxi.backend.api.exception.RestExceptionHandler;
import com.jptaxi.backend.service.DriverSearchService;

@WebMvcTest(DriverSearchController.class)
@Import(RestExceptionHandler.class)
class DriverSearchControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private DriverSearchService driverSearchService;

	@Test
	void search_ok_returnsBody() throws Exception {
		when(driverSearchService.search(
				eq(21.0285),
				eq(105.8542),
				eq(10.0),
				eq(null),
				eq(null),
				eq(null),
				eq(30),
				eq(0),
				eq(20)))
				.thenReturn(DriverSearchPageResponse.ofEmptyReason(
						0,
						20,
						DriverSearchNotificationCode.NO_MATCH_NO_ACTIVE_DRIVERS,
						DriverSearchMessages.noActiveDriversJa(),
						DriverSearchMessages.noActiveDriversVi()));

		mockMvc.perform(get("/api/v1/drivers/search")
						.param("latitude", "21.0285")
						.param("longitude", "105.8542"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0))
				.andExpect(jsonPath("$.empty").value(true))
				.andExpect(jsonPath("$.notificationCode").value("NO_MATCH_NO_ACTIVE_DRIVERS"))
				.andExpect(jsonPath("$.messageVi").exists());
	}

	@Test
	void search_missingLatitude_returnsBadRequest() throws Exception {
		mockMvc.perform(get("/api/v1/drivers/search").param("longitude", "105.8542"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void search_invalidJapaneseLevel_returnsBadRequest() throws Exception {
		mockMvc.perform(get("/api/v1/drivers/search")
						.param("latitude", "21.0285")
						.param("longitude", "105.8542")
						.param("minJapaneseLevel", "INVALID"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("BAD_REQUEST"));
	}

	@Test
	void search_passesFiltersToService() throws Exception {
		when(driverSearchService.search(
				eq(21.0),
				eq(106.0),
				eq(5.0),
				eq("7"),
				eq(BigDecimal.valueOf(4)),
				eq(3),
				eq(45),
				eq(1),
				eq(10)))
				.thenReturn(DriverSearchPageResponse.ofEmptyReason(
						1,
						10,
						DriverSearchNotificationCode.NO_MATCH_FILTERS_TOO_STRICT,
						DriverSearchMessages.filtersTooStrictJa(),
						DriverSearchMessages.filtersTooStrictVi()));

		mockMvc.perform(get("/api/v1/drivers/search")
						.param("latitude", "21")
						.param("longitude", "106")
						.param("radiusKm", "5")
						.param("vehicleType", "7")
						.param("minRating", "4")
						.param("minJapaneseLevel", "N3")
						.param("maxLocationAgeMinutes", "45")
						.param("page", "1")
						.param("size", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.size").value(10));
	}
}
