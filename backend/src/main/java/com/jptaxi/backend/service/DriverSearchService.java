package com.jptaxi.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jptaxi.backend.api.dto.driver.DriverSearchMessages;
import com.jptaxi.backend.api.dto.driver.DriverSearchNotificationCode;
import com.jptaxi.backend.api.dto.driver.DriverSearchPageResponse;
import com.jptaxi.backend.api.dto.driver.DriverSummaryDto;

@Service
@Transactional(readOnly = true)
public class DriverSearchService {

	private static final String COUNT_SQL = """
			WITH latest_loc AS (
			    SELECT DISTINCT ON (driver_id) driver_id, latitude, longitude, recorded_at
			    FROM driver_location_history
			    ORDER BY driver_id, recorded_at DESC
			),
			ratings AS (
			    SELECT t.driver_id,
			           AVG(r.score)::numeric(5,2) AS avg_score,
			           COUNT(*)::bigint AS rating_count
			    FROM trip t
			    INNER JOIN rating r ON r.trip_id = t.trip_id
			    GROUP BY t.driver_id
			),
			candidates AS (
			    SELECT d.driver_id,
			           d.first_name,
			           d.last_name,
			           d.avatar_url,
			           d.driver_japanese_level::text AS japanese_level,
			           v.vehicle_type::text AS vehicle_type,
			           ll.latitude::double precision AS current_lat,
			           ll.longitude::double precision AS current_lng,
			           ll.recorded_at AS location_recorded_at,
			           rt.avg_score,
			           rt.rating_count,
			           (6371.0 * acos(
			               LEAST(1.0::double precision, GREATEST(-1.0::double precision,
			                   cos(radians(:lat)) * cos(radians(ll.latitude::double precision)) *
			                   cos(radians(ll.longitude::double precision) - radians(:lng)) +
			                   sin(radians(:lat)) * sin(radians(ll.latitude::double precision))
			               ))
			           )) AS distance_km
			    FROM driver d
			    INNER JOIN vehicle v ON v.driver_id = d.driver_id
			    INNER JOIN latest_loc ll ON ll.driver_id = d.driver_id
			    LEFT JOIN ratings rt ON rt.driver_id = d.driver_id
			    WHERE d.status = CAST('approved' AS driver_status_type)
			      AND ll.recorded_at >= NOW() - (INTERVAL '1 minute' * :maxAgeMinutes)
			      AND (:vehicleType IS NULL OR v.vehicle_type = CAST(:vehicleType AS vehicle_type_enum))
			      AND (
			          :minRating IS NULL
			          OR (rt.avg_score IS NOT NULL AND rt.avg_score >= :minRating)
			      )
			      AND (
			          :minJapaneseOrdinal IS NULL
			          OR CASE d.driver_japanese_level
			                 WHEN 'N5' THEN 1 WHEN 'N4' THEN 2 WHEN 'N3' THEN 3
			                 WHEN 'N2' THEN 4 WHEN 'N1' THEN 5 WHEN 'Native' THEN 6
			             END >= :minJapaneseOrdinal
			      )
			),
			distance_filtered AS (
			    SELECT * FROM candidates WHERE distance_km <= :radiusKm
			)
			SELECT COUNT(*)::bigint FROM distance_filtered
			""";

	private static final String PAGE_SQL = """
			WITH latest_loc AS (
			    SELECT DISTINCT ON (driver_id) driver_id, latitude, longitude, recorded_at
			    FROM driver_location_history
			    ORDER BY driver_id, recorded_at DESC
			),
			ratings AS (
			    SELECT t.driver_id,
			           AVG(r.score)::numeric(5,2) AS avg_score,
			           COUNT(*)::bigint AS rating_count
			    FROM trip t
			    INNER JOIN rating r ON r.trip_id = t.trip_id
			    GROUP BY t.driver_id
			),
			candidates AS (
			    SELECT d.driver_id,
			           d.first_name,
			           d.last_name,
			           d.avatar_url,
			           d.driver_japanese_level::text AS japanese_level,
			           v.vehicle_type::text AS vehicle_type,
			           ll.latitude::double precision AS current_lat,
			           ll.longitude::double precision AS current_lng,
			           ll.recorded_at AS location_recorded_at,
			           rt.avg_score,
			           rt.rating_count,
			           (6371.0 * acos(
			               LEAST(1.0::double precision, GREATEST(-1.0::double precision,
			                   cos(radians(:lat)) * cos(radians(ll.latitude::double precision)) *
			                   cos(radians(ll.longitude::double precision) - radians(:lng)) +
			                   sin(radians(:lat)) * sin(radians(ll.latitude::double precision))
			               ))
			           )) AS distance_km
			    FROM driver d
			    INNER JOIN vehicle v ON v.driver_id = d.driver_id
			    INNER JOIN latest_loc ll ON ll.driver_id = d.driver_id
			    LEFT JOIN ratings rt ON rt.driver_id = d.driver_id
			    WHERE d.status = CAST('approved' AS driver_status_type)
			      AND ll.recorded_at >= NOW() - (INTERVAL '1 minute' * :maxAgeMinutes)
			      AND (:vehicleType IS NULL OR v.vehicle_type = CAST(:vehicleType AS vehicle_type_enum))
			      AND (
			          :minRating IS NULL
			          OR (rt.avg_score IS NOT NULL AND rt.avg_score >= :minRating)
			      )
			      AND (
			          :minJapaneseOrdinal IS NULL
			          OR CASE d.driver_japanese_level
			                 WHEN 'N5' THEN 1 WHEN 'N4' THEN 2 WHEN 'N3' THEN 3
			                 WHEN 'N2' THEN 4 WHEN 'N1' THEN 5 WHEN 'Native' THEN 6
			             END >= :minJapaneseOrdinal
			      )
			),
			distance_filtered AS (
			    SELECT * FROM candidates WHERE distance_km <= :radiusKm
			)
			SELECT df.driver_id,
			       df.first_name,
			       df.last_name,
			       df.avatar_url,
			       df.japanese_level,
			       df.vehicle_type,
			       df.current_lat,
			       df.current_lng,
			       df.location_recorded_at,
			       df.avg_score,
			       COALESCE(df.rating_count, 0::bigint) AS rating_count,
			       df.distance_km
			FROM distance_filtered df
			ORDER BY df.distance_km ASC
			LIMIT :limit OFFSET :offset
			""";

	/** Đã duyệt + vị trí mới, trong bán kính — không áp vehicle / rating / japanese. */
	private static final String RELAXED_IN_RADIUS_COUNT_SQL = """
			WITH latest_loc AS (
			    SELECT DISTINCT ON (driver_id) driver_id, latitude, longitude, recorded_at
			    FROM driver_location_history
			    ORDER BY driver_id, recorded_at DESC
			),
			relaxed_candidates AS (
			    SELECT d.driver_id,
			           (6371.0 * acos(
			               LEAST(1.0::double precision, GREATEST(-1.0::double precision,
			                   cos(radians(:lat)) * cos(radians(ll.latitude::double precision)) *
			                   cos(radians(ll.longitude::double precision) - radians(:lng)) +
			                   sin(radians(:lat)) * sin(radians(ll.latitude::double precision))
			               ))
			           )) AS distance_km
			    FROM driver d
			    INNER JOIN vehicle v ON v.driver_id = d.driver_id
			    INNER JOIN latest_loc ll ON ll.driver_id = d.driver_id
			    WHERE d.status = CAST('approved' AS driver_status_type)
			      AND ll.recorded_at >= NOW() - (INTERVAL '1 minute' * :maxAgeMinutes)
			)
			SELECT COUNT(*)::bigint FROM relaxed_candidates WHERE distance_km <= :radiusKm
			""";

	/** Đã duyệt + ít nhất một bản ghi vị trí trong cửa sổ thời gian (mọi khoảng cách). */
	private static final String FRESH_APPROVED_COUNT_SQL = """
			WITH latest_loc AS (
			    SELECT DISTINCT ON (driver_id) driver_id, latitude, longitude, recorded_at
			    FROM driver_location_history
			    ORDER BY driver_id, recorded_at DESC
			)
			SELECT COUNT(DISTINCT d.driver_id)::bigint
			FROM driver d
			INNER JOIN latest_loc ll ON ll.driver_id = d.driver_id
			WHERE d.status = CAST('approved' AS driver_status_type)
			  AND ll.recorded_at >= NOW() - (INTERVAL '1 minute' * :maxAgeMinutes)
			""";

	private final NamedParameterJdbcTemplate jdbc;

	public DriverSearchService(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public DriverSearchPageResponse search(
			double latitude,
			double longitude,
			double radiusKm,
			String vehicleType,
			BigDecimal minRating,
			Integer minJapaneseOrdinal,
			int maxLocationAgeMinutes,
			int page,
			int size) {

		MapSqlParameterSource params = baseParams(
				latitude,
				longitude,
				radiusKm,
				vehicleType,
				minRating,
				minJapaneseOrdinal,
				maxLocationAgeMinutes,
				page,
				size);

		long total = countOrZero(COUNT_SQL, params);
		int safePage = Math.max(0, page);

		if (total == 0L) {
			return buildEmptyResponse(params, safePage, size);
		}

		List<DriverSummaryDto> pageRows =
				jdbc.query(PAGE_SQL, params, (rs, rowNum) -> mapRow(rs));
		return DriverSearchPageResponse.ofResults(pageRows, total, safePage, size);
	}

	private DriverSearchPageResponse buildEmptyResponse(
			MapSqlParameterSource params, int page, int size) {

		long relaxedInRadius = countOrZero(RELAXED_IN_RADIUS_COUNT_SQL, params);
		long freshApproved = countOrZero(FRESH_APPROVED_COUNT_SQL, params);

		if (relaxedInRadius > 0L) {
			return DriverSearchPageResponse.ofEmptyReason(
					page,
					size,
					DriverSearchNotificationCode.NO_MATCH_FILTERS_TOO_STRICT,
					DriverSearchMessages.filtersTooStrictJa(),
					DriverSearchMessages.filtersTooStrictVi());
		}
		if (freshApproved > 0L) {
			return DriverSearchPageResponse.ofEmptyReason(
					page,
					size,
					DriverSearchNotificationCode.NO_MATCH_OUT_OF_RADIUS,
					DriverSearchMessages.outOfRadiusJa(),
					DriverSearchMessages.outOfRadiusVi());
		}
		return DriverSearchPageResponse.ofEmptyReason(
				page,
				size,
				DriverSearchNotificationCode.NO_MATCH_NO_ACTIVE_DRIVERS,
				DriverSearchMessages.noActiveDriversJa(),
				DriverSearchMessages.noActiveDriversVi());
	}

	private static MapSqlParameterSource baseParams(
			double latitude,
			double longitude,
			double radiusKm,
			String vehicleType,
			BigDecimal minRating,
			Integer minJapaneseOrdinal,
			int maxLocationAgeMinutes,
			int page,
			int size) {
		return new MapSqlParameterSource()
				.addValue("lat", latitude)
				.addValue("lng", longitude)
				.addValue("radiusKm", radiusKm)
				.addValue("vehicleType", vehicleType)
				.addValue("minRating", minRating)
				.addValue("minJapaneseOrdinal", minJapaneseOrdinal)
				.addValue("maxAgeMinutes", maxLocationAgeMinutes)
				.addValue("limit", size)
				.addValue("offset", Math.max(0, page) * size);
	}

	private long countOrZero(String sql, MapSqlParameterSource params) {
		try {
			Long n = jdbc.queryForObject(sql, params, Long.class);
			return n != null ? n : 0L;
		}
		catch (EmptyResultDataAccessException e) {
			return 0L;
		}
	}

	private static DriverSummaryDto mapRow(ResultSet rs) throws SQLException {
		BigDecimal avg = rs.getBigDecimal("avg_score");
		long ratingCount = rs.getLong("rating_count");
		double dist = rs.getDouble("distance_km");
		double distRounded = BigDecimal.valueOf(dist).setScale(3, RoundingMode.HALF_UP).doubleValue();
		Timestamp ts = rs.getTimestamp("location_recorded_at");
		Instant recorded = ts != null ? ts.toInstant() : null;
		return new DriverSummaryDto(
				rs.getLong("driver_id"),
				rs.getString("first_name"),
				rs.getString("last_name"),
				rs.getString("avatar_url"),
				rs.getString("vehicle_type"),
				rs.getString("japanese_level"),
				avg,
				ratingCount,
				distRounded,
				rs.getDouble("current_lat"),
				rs.getDouble("current_lng"),
				recorded);
	}
}
