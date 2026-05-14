package com.jptaxi.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public final class Profiles {
    private Profiles() {
    }

    public record LoginHistoryItem(
            Integer loginId,
            String ipAddress,
            OffsetDateTime loginTime
    ) {
    }

    public record CustomerProfile(
            Integer customerId,
            String lastName,
            String firstName,
            String gender,
            LocalDate birthDate,
            String phone,
            String email,
            Boolean emailVerified,
            Boolean phoneVerified,
            String avatarUrl,
            OffsetDateTime createdAt,
            List<LoginHistoryItem> loginHistory
    ) {
    }

    public record CustomerProfileUpdate(
            @NotBlank String lastName,
            @NotBlank String firstName,
            @Pattern(regexp = "Male|Female|Other") String gender,
            LocalDate birthDate,
            @NotBlank String phone,
            @Email @NotBlank String email,
            String avatarUrl
    ) {
    }

    public record VehicleInfo(
            Integer vehicleId,
            String vehicleType,
            String licensePlate,
            String brand,
            String color,
            Integer manufactureYear,
            String vehiclePhotoUrl,
            String registrationPaperUrl
    ) {
    }

    public record LicenseInfo(
            Integer licenseId,
            String licenseType,
            LocalDate issueDate,
            String issuePlace,
            LocalDate expiryDate,
            String frontImageUrl,
            String backImageUrl
    ) {
    }

    public record BankAccountInfo(
            Integer accountId,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }

    public record DriverTripInfo(
            Integer tripId,
            String pickupAddress,
            String dropoffAddress,
            OffsetDateTime startTime,
            OffsetDateTime endTime,
            BigDecimal distanceKm,
            Integer finalFareVnd,
            Integer finalFareJpy,
            String status
    ) {
    }

    public record DriverProfile(
            Integer driverId,
            String lastName,
            String firstName,
            String gender,
            LocalDate birthDate,
            String phone,
            String email,
            String nationality,
            String idNumber,
            Boolean emailVerified,
            Boolean phoneVerified,
            String status,
            OffsetDateTime approvedAt,
            OffsetDateTime createdAt,
            String avatarUrl,
            String japaneseLevel,
            VehicleInfo vehicle,
            List<LicenseInfo> licenses,
            BankAccountInfo bankAccount,
            List<DriverTripInfo> trips,
            List<LoginHistoryItem> loginHistory
    ) {
    }

    public record DriverProfileUpdate(
            @NotBlank String lastName,
            @NotBlank String firstName,
            @Pattern(regexp = "Male|Female|Other") String gender,
            LocalDate birthDate,
            @NotBlank String phone,
            @Email @NotBlank String email,
            @NotBlank String nationality,
            String idNumber,
            @Pattern(regexp = "N5|N4|N3|N2|N1|Native") String japaneseLevel,
            String avatarUrl
    ) {
    }

    public record BankAccountUpdate(
            @NotBlank String bankName,
            @NotBlank String accountNumber,
            @NotBlank String accountHolder
    ) {
    }
}
