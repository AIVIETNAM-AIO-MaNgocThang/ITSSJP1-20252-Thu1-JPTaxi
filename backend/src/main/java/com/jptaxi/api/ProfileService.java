package com.jptaxi.api;

import com.jptaxi.api.Profiles.*;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {
    private final JdbcClient jdbc;

    public ProfileService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public CustomerProfile getCustomerProfile(int customerId) {
        CustomerProfile profile = jdbc.sql("""
                        SELECT customer_id, last_name, first_name, gender::text AS gender, birth_date,
                               phone, email, is_email_verified, is_phone_verified, avatar_url, created_at
                        FROM customer
                        WHERE customer_id = :customerId
                        """)
                .param("customerId", customerId)
                .query((rs, rowNum) -> new CustomerProfile(
                        rs.getInt("customer_id"),
                        rs.getString("last_name"),
                        rs.getString("first_name"),
                        rs.getString("gender"),
                        rs.getObject("birth_date", java.time.LocalDate.class),
                        rs.getString("phone"),
                        rs.getString("email"),
                        rs.getBoolean("is_email_verified"),
                        rs.getBoolean("is_phone_verified"),
                        rs.getString("avatar_url"),
                        rs.getObject("created_at", java.time.OffsetDateTime.class),
                        List.of()
                ))
                .single();

        return new CustomerProfile(
                profile.customerId(),
                profile.lastName(),
                profile.firstName(),
                profile.gender(),
                profile.birthDate(),
                profile.phone(),
                profile.email(),
                profile.emailVerified(),
                profile.phoneVerified(),
                profile.avatarUrl(),
                profile.createdAt(),
                getLoginHistory("customer", customerId)
        );
    }

    public CustomerProfile updateCustomerProfile(int customerId, CustomerProfileUpdate update) {
        int updated = jdbc.sql("""
                        UPDATE customer
                           SET last_name = :lastName,
                               first_name = :firstName,
                               gender = CAST(:gender AS gender_type),
                               birth_date = COALESCE(:birthDate, birth_date),
                               phone = :phone,
                               email = :email,
                               avatar_url = :avatarUrl,
                               updated_at = CURRENT_TIMESTAMP
                         WHERE customer_id = :customerId
                        """)
                .param("customerId", customerId)
                .param("lastName", update.lastName())
                .param("firstName", update.firstName())
                .param("gender", update.gender())
                .param("birthDate", update.birthDate())
                .param("phone", update.phone())
                .param("email", update.email())
                .param("avatarUrl", update.avatarUrl())
                .update();
        if (updated == 0) {
            throw new EmptyResultDataAccessException(1);
        }
        return getCustomerProfile(customerId);
    }

    public DriverProfile getDriverProfile(int driverId) {
        DriverProfile base = jdbc.sql("""
                        SELECT driver_id, last_name, first_name, gender::text AS gender, birth_date,
                               phone, email, nationality, id_number, is_email_verified, is_phone_verified,
                               status::text AS status, approved_at, created_at, avatar_url,
                               driver_japanese_level::text AS japanese_level
                        FROM driver
                        WHERE driver_id = :driverId
                        """)
                .param("driverId", driverId)
                .query((rs, rowNum) -> new DriverProfile(
                        rs.getInt("driver_id"),
                        rs.getString("last_name"),
                        rs.getString("first_name"),
                        rs.getString("gender"),
                        rs.getObject("birth_date", java.time.LocalDate.class),
                        rs.getString("phone"),
                        rs.getString("email"),
                        rs.getString("nationality"),
                        rs.getString("id_number"),
                        rs.getBoolean("is_email_verified"),
                        rs.getBoolean("is_phone_verified"),
                        rs.getString("status"),
                        rs.getObject("approved_at", java.time.OffsetDateTime.class),
                        rs.getObject("created_at", java.time.OffsetDateTime.class),
                        rs.getString("avatar_url"),
                        rs.getString("japanese_level"),
                        null,
                        List.of(),
                        null,
                        List.of(),
                        List.of()
                ))
                .single();

        return new DriverProfile(
                base.driverId(),
                base.lastName(),
                base.firstName(),
                base.gender(),
                base.birthDate(),
                base.phone(),
                base.email(),
                base.nationality(),
                base.idNumber(),
                base.emailVerified(),
                base.phoneVerified(),
                base.status(),
                base.approvedAt(),
                base.createdAt(),
                base.avatarUrl(),
                base.japaneseLevel(),
                getVehicle(driverId),
                getLicenses(driverId),
                getBankAccount(driverId),
                getTrips(driverId),
                getLoginHistory("driver", driverId)
        );
    }

    public DriverProfile updateDriverProfile(int driverId, DriverProfileUpdate update) {
        int updated = jdbc.sql("""
                        UPDATE driver
                           SET last_name = :lastName,
                               first_name = :firstName,
                               gender = CAST(:gender AS gender_type),
                               birth_date = COALESCE(:birthDate, birth_date),
                               phone = :phone,
                               email = :email,
                               nationality = :nationality,
                               id_number = :idNumber,
                               driver_japanese_level = CAST(:japaneseLevel AS driver_japanese_level_enum),
                               avatar_url = :avatarUrl,
                               updated_at = CURRENT_TIMESTAMP
                         WHERE driver_id = :driverId
                        """)
                .param("driverId", driverId)
                .param("lastName", update.lastName())
                .param("firstName", update.firstName())
                .param("gender", update.gender())
                .param("birthDate", update.birthDate())
                .param("phone", update.phone())
                .param("email", update.email())
                .param("nationality", update.nationality())
                .param("idNumber", update.idNumber())
                .param("japaneseLevel", update.japaneseLevel())
                .param("avatarUrl", update.avatarUrl())
                .update();
        if (updated == 0) {
            throw new EmptyResultDataAccessException(1);
        }
        return getDriverProfile(driverId);
    }

    public DriverProfile updateBankAccount(int driverId, BankAccountUpdate update) {
        jdbc.sql("""
                        INSERT INTO driver_bank_account (driver_id, bank_name, account_number, account_holder)
                        VALUES (:driverId, :bankName, :accountNumber, :accountHolder)
                        ON CONFLICT (driver_id) DO UPDATE
                           SET bank_name = EXCLUDED.bank_name,
                               account_number = EXCLUDED.account_number,
                               account_holder = EXCLUDED.account_holder
                        """)
                .param("driverId", driverId)
                .param("bankName", update.bankName())
                .param("accountNumber", update.accountNumber())
                .param("accountHolder", update.accountHolder())
                .update();
        return getDriverProfile(driverId);
    }

    private VehicleInfo getVehicle(int driverId) {
        return jdbc.sql("""
                        SELECT vehicle_id, vehicle_type::text AS vehicle_type, license_plate, brand, color,
                               manufacture_year, vehicle_photo_url, registration_paper_url
                        FROM vehicle
                        WHERE driver_id = :driverId
                        """)
                .param("driverId", driverId)
                .query((rs, rowNum) -> new VehicleInfo(
                        rs.getInt("vehicle_id"),
                        rs.getString("vehicle_type"),
                        rs.getString("license_plate"),
                        rs.getString("brand"),
                        rs.getString("color"),
                        rs.getInt("manufacture_year"),
                        rs.getString("vehicle_photo_url"),
                        rs.getString("registration_paper_url")
                ))
                .optional()
                .orElse(null);
    }

    private List<LicenseInfo> getLicenses(int driverId) {
        return jdbc.sql("""
                        SELECT license_id, license_type::text AS license_type, issue_date, issue_place,
                               expiry_date, front_image_url, back_image_url
                        FROM driver_license
                        WHERE driver_id = :driverId
                        ORDER BY expiry_date DESC
                        """)
                .param("driverId", driverId)
                .query((rs, rowNum) -> new LicenseInfo(
                        rs.getInt("license_id"),
                        rs.getString("license_type"),
                        rs.getObject("issue_date", java.time.LocalDate.class),
                        rs.getString("issue_place"),
                        rs.getObject("expiry_date", java.time.LocalDate.class),
                        rs.getString("front_image_url"),
                        rs.getString("back_image_url")
                ))
                .list();
    }

    private BankAccountInfo getBankAccount(int driverId) {
        return jdbc.sql("""
                        SELECT account_id, bank_name, account_number, account_holder
                        FROM driver_bank_account
                        WHERE driver_id = :driverId
                        """)
                .param("driverId", driverId)
                .query((rs, rowNum) -> new BankAccountInfo(
                        rs.getInt("account_id"),
                        rs.getString("bank_name"),
                        rs.getString("account_number"),
                        rs.getString("account_holder")
                ))
                .optional()
                .orElse(null);
    }

    private List<DriverTripInfo> getTrips(int driverId) {
        return jdbc.sql("""
                        SELECT t.trip_id, rr.pickup_address, rr.dropoff_address, t.start_time, t.end_time,
                               t.actual_distance_km, t.final_fare_vnd, t.final_fare_jpy, t.status::text AS status
                        FROM trip t
                        JOIN ride_request rr ON rr.request_id = t.request_id
                        WHERE t.driver_id = :driverId
                        ORDER BY t.start_time DESC
                        LIMIT 20
                        """)
                .param("driverId", driverId)
                .query((rs, rowNum) -> new DriverTripInfo(
                        rs.getInt("trip_id"),
                        rs.getString("pickup_address"),
                        rs.getString("dropoff_address"),
                        rs.getObject("start_time", java.time.OffsetDateTime.class),
                        rs.getObject("end_time", java.time.OffsetDateTime.class),
                        rs.getBigDecimal("actual_distance_km"),
                        rs.getInt("final_fare_vnd"),
                        rs.getInt("final_fare_jpy"),
                        rs.getString("status")
                ))
                .list();
    }

    private List<LoginHistoryItem> getLoginHistory(String userType, int userId) {
        return jdbc.sql("""
                        SELECT login_id, ip_address, login_time
                        FROM login_history
                        WHERE user_type = CAST(:userType AS user_type_enum)
                          AND user_id = :userId
                        ORDER BY login_time DESC
                        LIMIT 10
                        """)
                .param("userType", userType)
                .param("userId", userId)
                .query((rs, rowNum) -> new LoginHistoryItem(
                        rs.getInt("login_id"),
                        rs.getString("ip_address"),
                        rs.getObject("login_time", java.time.OffsetDateTime.class)
                ))
                .list();
    }
}
