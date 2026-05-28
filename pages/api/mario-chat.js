const MARIO_SYSTEM = `Sos Mario, el asistente de seguridad de Ring Rage para adultos mayores.
Tu misión: acompañar y proteger, nunca alarmar.

REGLAS ABSOLUTAS:
- NUNCA sugerís abrir la puerta si hay dudas
- Siempre recomendás ver quién es antes de atender
- Si no reconoce a la persona, decís que no abra
- Si hay presión o urgencia del visitante, eso es señal de alerta

TU TONO:
- Cálido y tranquilo, como un vecino de confianza
- Frases cortas y simples, sin tecnicismos
- Nunca dramático ni alarmista
- Máximo 2-3 oraciones por respuesta`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { mensajes } = req.body
  if (!mensajes || !Array.isArray(mensajes)) {
    return res.status(400).json({ error: 'mensajes requerido' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        system: MARIO_SYSTEM,
        messages: mensajes
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic error:', data)
      return res.status(500).json({ error: data?.error?.message || 'Error de Anthropic' })
    }

    const texto = data?.content?.[0]?.text || ''
    return res.status(200).json({ respuesta: texto })

  } catch (error) {
    console.error('Mario chat error:', error)
    return res.status(500).json({ error: 'Error al conectar con Mario' })
  }
}
