package com.jptaxi.api;

import com.jptaxi.api.Profiles.BankAccountUpdate;
import com.jptaxi.api.Profiles.CustomerProfile;
import com.jptaxi.api.Profiles.CustomerProfileUpdate;
import com.jptaxi.api.Profiles.DriverProfile;
import com.jptaxi.api.Profiles.DriverProfileUpdate;
import jakarta.validation.Valid;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping("/customers/{customerId}/profile")
    public CustomerProfile getCustomer(@PathVariable int customerId) {
        try {
            return service.getCustomerProfile(customerId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }
    }

    @PutMapping("/customers/{customerId}/profile")
    public CustomerProfile updateCustomer(
            @PathVariable int customerId,
            @Valid @RequestBody CustomerProfileUpdate update
    ) {
        try {
            return service.updateCustomerProfile(customerId, update);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }
    }

    @GetMapping("/drivers/{driverId}/profile")
    public DriverProfile getDriver(@PathVariable int driverId) {
        try {
            return service.getDriverProfile(driverId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found");
        }
    }

    @PutMapping("/drivers/{driverId}/profile")
    public DriverProfile updateDriver(
            @PathVariable int driverId,
            @Valid @RequestBody DriverProfileUpdate update
    ) {
        try {
            return service.updateDriverProfile(driverId, update);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found");
        }
    }

    @PutMapping("/drivers/{driverId}/bank-account")
    public DriverProfile updateBank(
            @PathVariable int driverId,
            @Valid @RequestBody BankAccountUpdate update
    ) {
        return service.updateBankAccount(driverId, update);
    }
}
