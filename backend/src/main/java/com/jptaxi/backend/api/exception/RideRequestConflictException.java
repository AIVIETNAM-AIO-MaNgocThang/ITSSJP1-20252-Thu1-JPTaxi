package com.jptaxi.backend.api.exception;

public class RideRequestConflictException extends RuntimeException {

	private final String currentStatus;

	public RideRequestConflictException(String message, String currentStatus) {
		super(message);
		this.currentStatus = currentStatus;
	}

	public String getCurrentStatus() {
		return currentStatus;
	}
}
