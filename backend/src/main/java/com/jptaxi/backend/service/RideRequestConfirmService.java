package com.jptaxi.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingRequest;
import com.jptaxi.backend.api.dto.booking.ConfirmRideBookingResponse;
import com.jptaxi.backend.api.exception.RideRequestConflictException;
import com.jptaxi.backend.api.exception.RideRequestForbiddenException;
import com.jptaxi.backend.api.exception.RideRequestNotFoundException;

@Service
@Transactional
public class RideRequestConfirmService {

	private static final String STATUS_PENDING = "pending";
	private static final String STATUS_SEARCHING = "searching";

	private static final String SELECT_BY_ID = """
			SELECT customer_id, status::text AS status
			FROM ride_request
			WHERE request_id = :requestId
			""";

	private static final String UPDATE_CONFIRM = """
			UPDATE ride_request
			SET status = CAST(:newStatus AS ride_request_status_type),
			    actual_passenger_name = COALESCE(:passengerName, actual_passenger_name),
			    actual_passenger_phone = COALESCE(:passengerPhone, actual_passenger_phone),
			    note_to_driver = COALESCE(:noteToDriver, note_to_driver)
			WHERE request_id = :requestId
			  AND customer_id = :customerId
			  AND status = CAST(:expectedStatus AS ride_request_status_type)
			""";

	private final NamedParameterJdbcTemplate jdbc;

	public RideRequestConfirmService(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	/**
	 * Xác nhận đặt xe: chỉ cho phép khi {@code status = pending} → {@code searching}.
	 */
	public ConfirmRideBookingResponse confirm(
			long requestId,
			long customerId,
			ConfirmRideBookingRequest request) {

		ConfirmRideBookingRequest payload =
				request != null ? request : new ConfirmRideBookingRequest(null, null, null);

		List<Map<String, Object>> found =
				jdbc.queryForList(SELECT_BY_ID, Map.of("requestId", requestId));
		if (found.isEmpty()) {
			throw new RideRequestNotFoundException("Không tìm thấy yêu cầu đặt xe: " + requestId);
		}
		Map<String, Object> row = found.get(0);

		long ownerId = ((Number) row.get("customer_id")).longValue();
		String current = Objects.toString(row.get("status"), "");

		if (ownerId != customerId) {
			throw new RideRequestForbiddenException("Không có quyền xác nhận yêu cầu này.");
		}
		if (!STATUS_PENDING.equalsIgnoreCase(current)) {
			throw new RideRequestConflictException(
					"Chỉ có thể xác nhận khi trạng thái là pending.", current);
		}

		MapSqlParameterSource params = new MapSqlParameterSource()
				.addValue("requestId", requestId)
				.addValue("customerId", customerId)
				.addValue("expectedStatus", STATUS_PENDING)
				.addValue("newStatus", STATUS_SEARCHING)
				.addValue("passengerName", blankToNull(payload.actualPassengerName()))
				.addValue("passengerPhone", blankToNull(payload.actualPassengerPhone()))
				.addValue("noteToDriver", blankToNull(payload.noteToDriver()));

		int updated = jdbc.update(UPDATE_CONFIRM, params);
		if (updated != 1) {
			throw new RideRequestConflictException(
					"Trạng thái đã thay đổi, không thể xác nhận.", current);
		}

		return new ConfirmRideBookingResponse(
				requestId,
				STATUS_PENDING,
				STATUS_SEARCHING,
				"予約を確定しました。ドライバーを検索しています。",
				"Đã xác nhận đặt xe. Hệ thống đang tìm tài xế.");
	}

	private static String blankToNull(String s) {
		if (s == null || s.isBlank()) {
			return null;
		}
		return s.trim();
	}
}
