package com.jptaxi.backend.api.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
public class RestExceptionHandler {

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("error", "BAD_REQUEST", "message", ex.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
		String msg = ex.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(f -> f.getField() + ": " + f.getDefaultMessage())
				.orElse("Validation failed");
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("error", "VALIDATION_ERROR", "message", msg));
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	public ResponseEntity<Map<String, String>> methodValidation(HandlerMethodValidationException ex) {
		String msg = ex.getAllErrors().stream()
				.findFirst()
				.map(Object::toString)
				.orElse("Validation failed");
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("error", "VALIDATION_ERROR", "message", msg));
	}

	@ExceptionHandler(RideRequestNotFoundException.class)
	public ResponseEntity<Map<String, String>> rideNotFound(RideRequestNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Map.of("error", "NOT_FOUND", "message", ex.getMessage()));
	}

	@ExceptionHandler(RideRequestForbiddenException.class)
	public ResponseEntity<Map<String, String>> rideForbidden(RideRequestForbiddenException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(Map.of("error", "FORBIDDEN", "message", ex.getMessage()));
	}

	@ExceptionHandler(RideRequestConflictException.class)
	public ResponseEntity<Map<String, Object>> rideConflict(RideRequestConflictException ex) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("error", "CONFLICT");
		body.put("message", ex.getMessage());
		body.put("currentStatus", ex.getCurrentStatus());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
	}
}
