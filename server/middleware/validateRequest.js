import { validationResult } from "express-validator";

export default function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = errors.array(); // para incluir los errores específicos
    return next(err); // <- pasa al errorHandler
  }
  next();
}
