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
export function generarMensajeWhatsApp({ empresa, riesgo, videoUrl, residenteNombre }) {
  const iconos = { bajo: '✅', medio: '⚠️', alto: '🚨' }
  const icono = iconos[riesgo.nivel]

  const nombreEmpresa = empresa?.nombre || 'Visitante sin registrar'
  const residente = residenteNombre || 'tu familiar'

  let mensaje = `${icono} *Ring Rage — alguien está en la puerta de ${residente}*\n\n`
  mensaje += `🏢 *Empresa:* ${nombreEmpresa}\n`
  mensaje += `📋 *Rubro:* ${empresa?.rubro || 'Desconocido'}\n`
  mensaje += `🔐 *Código:* ${empresa?.codigo || 'No presentó código'}\n\n`

  if (riesgo.nivel === 'alto') {
    mensaje += `🚨 *ALERTA DE RIESGO:*\n`
    riesgo.motivos.forEach(m => { mensaje += `• ${m}\n` })
    mensaje += `\n⚠️ Recomendamos NO abrir la puerta.\n\n`
  } else if (riesgo.nivel === 'medio') {
    mensaje += `⚠️ *Revisá antes de abrir:*\n`
    riesgo.motivos.forEach(m => { mensaje += `• ${m}\n` })
    mensaje += '\n'
  } else {
    mensaje += `✅ Empresa verificada en Ring Rage.\n\n`
  }

  if (videoUrl) {
    mensaje += `📹 *Ver en vivo:* ${videoUrl}\n\n`
  }

  mensaje += `_Ring Rage · Protegiendo a quienes más queremos_`

  return mensaje
}
