export function errorHandler(err, req, res, next) {
  // Log del error
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determinar código de estado
  const statusCode = err.statusCode || 500;

  // Respuesta de error
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    },
    timestamp: new Date().toISOString()
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString()
  });
}