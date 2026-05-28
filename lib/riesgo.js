/**
 * Evalúa el nivel de riesgo de una empresa basándose en sus respuestas
 * del cuestionario de registro.
 * Retorna: { nivel: 'bajo' | 'medio' | 'alto', motivos: string[] }
 */
export function evaluarRiesgo(empresa) {
  const motivos = []
  let puntos = 0

  if (!empresa) return { nivel: 'alto', motivos: ['Empresa no registrada en Ring Rage'] }

  // Sin aviso previo al cliente
  if (empresa.contacto_previo === 'Sin aviso previo') {
    puntos += 3
    motivos.push('No avisa antes de visitar')
  }

  // Cobra siempre en efectivo
  if (empresa.cobro_efectivo === 'Sí, siempre en efectivo') {
    puntos += 3
    motivos.push('Cobra en efectivo en primera visita')
  }

  // Sin identificación
  if (empresa.identificacion === 'No') {
    puntos += 2
    motivos.push('Empleados sin identificación visible')
  }

  // Pide datos bancarios
  if (empresa.datos_bancarios !== 'Jamás') {
    puntos += 4
    motivos.push('Puede solicitar datos bancarios durante la visita')
  }

  // Empresa muy nueva
  if (empresa.antiguedad === 'Menos de 1 año') {
    puntos += 1
    motivos.push('Empresa con menos de 1 año de operación')
  }

  if (puntos === 0) return { nivel: 'bajo', motivos: [] }
  if (puntos <= 2) return { nivel: 'medio', motivos }
  return { nivel: 'alto', motivos }
}

/**
 * Genera el mensaje de WhatsApp según el nivel de riesgo
 */
export function generarMensajeWhatsApp({ empresa, riesgo, videoUrl, residenteNombre, residenteId }) {
  const iconos = { bajo: '🔔', medio: '⚠️', alto: '🚨' }
  const icono = iconos[riesgo.nivel]
  const residente = residenteNombre || 'tu familiar'
  const nombreEmpresa = empresa?.nombre || 'Visitante sin código'

  let mensaje = `${icono} *${nombreEmpresa}* está en la puerta de ${residente}.\n\n`

  if (riesgo.nivel === 'alto') {
    mensaje += `🚨 Revisá bien antes de abrir.\n\n`
  }

  if (residenteId) {
    mensaje += `📱 https://ringrage.vercel.app/residente?id=${residenteId}`
  }

  return mensaje
}
