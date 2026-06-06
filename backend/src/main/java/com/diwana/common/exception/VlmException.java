package com.diwana.common.exception;

public class VlmException extends RuntimeException {
    public VlmException(String message) {
        super(message);
    }

    public VlmException(String message, Throwable cause) {
        super(message, cause);
    }
}