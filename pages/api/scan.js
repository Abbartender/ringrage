import { supabaseAdmin } from '../../lib/supabase'
import { evaluarRiesgo, generarMensajeWhatsApp } from '../../lib/riesgo'

const twilioHabilitado = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_WHATSAPP_FROM
)

async function crearSalaDaily() {
  try {
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: { exp: Math.floor(Date.now() / 1000) + 3600 }
      })
    })
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' })

  const { residenteId, codigoEmpresa } = req.body

  if (!residenteId) return res.status(400).json({ error: 'residenteId requerido' })

  try {
    const { data: residente, error: errResidente } = await supabaseAdmin
      .from('residentes')
      .select('*, contactos(*)')
      .eq('id', residenteId)
      .single()

    if (errResidente || !residente) return res.status(404).json({ error: 'Residente no encontrado' })

    let empresa = null
    if (codigoEmpresa) {
      const { data } = await supabaseAdmin
        .from('empresas')
        .select('*')
        .eq('codigo', codigoEmpresa.toUpperCase())
        .eq('activa', true)
        .single()
      empresa = data
    }

    const riesgo = evaluarRiesgo(empresa)
    const roomUrl = await crearSalaDaily()

    await supabaseAdmin.from('visitas').insert({
      residente_id: residenteId,
      empresa_id: empresa?.id || null,
      codigo_presentado: codigoEmpresa || null,
      nivel_riesgo: riesgo.nivel,
      motivos_riesgo: riesgo.motivos,
      video_url: roomUrl,
      timestamp: new Date().toISOString()
    })

    const mensaje = generarMensajeWhatsApp({
      empresa,
      riesgo,
      videoUrl: roomUrl,
      residenteNombre: residente.nombre
    })

    if (twilioHabilitado) {
      const twilio = require('twilio')
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await Promise.allSettled(
        residente.contactos.map(c =>
          client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${c.telefono}`,
            body: mensaje
          }).catch(e => console.error(e))
        )
      )
    }

    return res.status(200).json({ ok: true, riesgo: riesgo.nivel, roomUrl, empresa: empresa ? { nombre: empresa.nombre, rubro: empresa.rubro } : null })

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Error interno' })
    }
}
