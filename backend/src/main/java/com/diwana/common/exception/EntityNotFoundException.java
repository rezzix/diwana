package com.diwana.common.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String entity, Long id) {
        super(entity + " not found with id: " + id);
    }

    public EntityNotFoundException(String message) {
        super(message);
    }
}
