package com.jptaxi.backend.api.exception;

public class RideRequestNotFoundException extends RuntimeException {

	public RideRequestNotFoundException(String message) {
		super(message);
	}
}
