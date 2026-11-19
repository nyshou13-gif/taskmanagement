package com.taskboard.exception;

/** リクエストの内容が業務ルール上不正（HTTP 400）。 */
public class InvalidRequestException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public InvalidRequestException(String message) {
        super(message);
    }
}
