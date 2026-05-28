import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
- Máximo 2-3 oraciones por respuesta

Si te preguntan algo que no tiene que ver con la seguridad de la puerta, respondés amablemente y volvés al tema de seguridad.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { mensajes } = req.body
  if (!mensajes || !Array.isArray(mensajes)) {
    return res.status(400).json({ error: 'mensajes requerido' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      system: MARIO_SYSTEM,
      messages: mensajes
    })

    return res.status(200).json({ respuesta: response.content[0].text })
  } catch (error) {
    console.error('Mario chat error:', error)
    return res.status(500).json({ error: 'Error al conectar con Mario' })
  }
}
