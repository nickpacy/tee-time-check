const {
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalError,
} = require("./errorTypes");

const errorHandler = (err, req, res, next) => {


  console.error(err);

  // Handle specific error types
  // if (err instanceof DatabaseError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof ValidationError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof NotFoundError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof UnauthorizedError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof ForbiddenError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof ConflictError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message + detailedError });
  // } else if (err instanceof InternalError) {
  //   const detailedError = err.originalError ? ` - Details: ${err.originalError.message}` : '';
  //   return res.status(err.status).json({ error: err.message, message:detailedError });
  // }

  // Generic error handling for unclassified errors
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const detailedError = err.originalError ? err.originalError : '';
  return res.status(status).json({ message: message, detail: detailedError });
};

module.exports = errorHandler;
