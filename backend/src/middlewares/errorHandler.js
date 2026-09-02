// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[GlobalErrorHandler]', {
    method: req.method,
    url: req.originalUrl || req.url,
    message: err.message,
    code: err.code,
    status: err.status || err.statusCode,
  })

  // Error de parsing de JSON en el body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'json-invalido',
      detail: 'El cuerpo de la solicitud (payload JSON) tiene un formato inválido.'
    })
  }

  // Error de límite de tasa (Rate Limiting)
  if (err.status === 429 || err.statusCode === 429) {
    return res.status(429).json({
      error: 'demasiadas-peticiones',
      detail: err.message || 'Has superado el límite de peticiones permitidas.'
    })
  }

  // Error de base de datos o permisos
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(403).json({
      error: 'permiso-denegado',
      detail: 'Acceso denegado a la base de datos para la operación solicitada.'
    })
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      error: 'base-datos-no-disponible',
      detail: 'No se pudo establecer conexión con el servidor de base de datos.'
    })
  }

  const statusCode = Number(err.status || err.statusCode || 500)
  const isProduction = process.env.NODE_ENV === 'production'

  return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    error: err.name || 'error-interno',
    detail: isProduction
      ? 'Ocurrió un error inesperado en el servidor.'
      : err.message || 'Error interno del servidor.'
  })
}
