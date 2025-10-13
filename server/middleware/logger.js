/**
 * Logger Middleware
 * 
 * Registra todas las peticiones HTTP.
 */

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log cuando la respuesta finaliza
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    // Color según status
    const statusColor = res.statusCode >= 500 ? '🔴'
      : res.statusCode >= 400 ? '🟡'
      : res.statusCode >= 300 ? '🔵'
      : '🟢';

    console.log(
      `${statusColor} ${log.method} ${log.path} - ${log.status} (${log.duration})`
    );
  });

  next();
}