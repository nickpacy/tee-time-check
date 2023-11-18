class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "DatabaseError";
    this.status = 500;
    this.originalError = originalError;
  }
}

class ValidationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.originalError = originalError;
  }
}

class NotFoundError extends Error {
  constructor(message = "Resource not found", originalError = null) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
    this.originalError = originalError;
  }
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access", originalError = null) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
    this.originalError = originalError;
  }
}

class ForbiddenError extends Error {
  constructor(message = "Access forbidden", originalError = null) {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
    this.originalError = originalError;
  }
}

class ConflictError extends Error {
  constructor(message = "Conflict occurred", originalError = null) {
    super(message);
    this.name = "ConflictError";
    this.status = 409;
    this.originalError = originalError;
  }
}

class InternalError extends Error {
  constructor(message = "Internal server error", originalError = null) {
    super(message);
    this.name = "InternalError";
    this.status = 500;
    this.originalError = originalError;
  }
}

module.exports = {
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalError,
};
