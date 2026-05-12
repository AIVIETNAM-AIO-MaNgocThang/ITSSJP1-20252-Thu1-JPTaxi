package com.jptaxi.backend.api.exception;

public class RideRequestForbiddenException extends RuntimeException {

	public RideRequestForbiddenException(String message) {
		super(message);
	}
}
