"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.ForbiddenException = exports.UnauthorizedException = exports.NotFoundException = exports.conflictException = exports.BadRequest = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    cause;
    constructor(message, statusCode, cause) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequest extends AppError {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.BadRequest = BadRequest;
class conflictException extends AppError {
    constructor(message, cause) {
        super(message, 409, cause);
    }
}
exports.conflictException = conflictException;
class NotFoundException extends AppError {
    constructor(message, cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class UnauthorizedException extends AppError {
    constructor(message, cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends AppError {
    constructor(message, cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
exports.globalErrorHandling = ((error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        error_message: error.message || "something went wrong !",
        stack: process.env.MOOD === "development" ? error.stack : undefined,
        cause: error.cause,
    });
});
