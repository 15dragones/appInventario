export function getApiErrorMessage(error) {
  return (
    error.response?.data?.error ||
    'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.'
  )
}
