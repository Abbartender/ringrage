import { supabaseAdmin } from '../../lib/supabase'
import { evaluarRiesgo, generarMensajeWhatsApp } from '../../lib/riesgo'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { residenteId, codigoEmpresa, videoUrl } = req.body

  if (!residenteId) {
    return res.status(400).json({ error: 'residenteId requerido' })
  }

  try {
    // 1. Buscar datos del residente y sus contactos de confianza
    const { data: residente, error: errResidente } = await supabaseAdmin
      .from('residentes')
      .select('*, contactos(*)')
      .eq('id', residenteId)
      .single()

    if (errResidente || !residente) {
      return res.status(404).json({ error: 'Residente no encontrado' })
    }

    // 2. Buscar empresa por código (si presentó uno)
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

    // 3. Evaluar riesgo
    const riesgo = evaluarRiesgo(empresa)

    // 4. Registrar visita en base de datos
    const { data: visita } = await supabaseAdmin
      .from('visitas')
      .insert({
        residente_id: residenteId,
        empresa_id: empresa?.id || null,
        codigo_presentado: codigoEmpresa || null,
        nivel_riesgo: riesgo.nivel,
        motivos_riesgo: riesgo.motivos,
        video_url: videoUrl || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    // 5. Notificar a todos los contactos de confianza por WhatsApp
    const mensaje = generarMensajeWhatsApp({
      empresa,
      riesgo,
      videoUrl,
      residenteNombre: residente.nombre
    })

    const notificaciones = residente.contactos.map(contacto =>
      twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${contacto.telefono}`,
        body: mensaje
      }).catch(err => console.error(`Error enviando a ${contacto.telefono}:`, err))
    )

    await Promise.allSettled(notificaciones)

    // 6. Responder al frontend del visitante
    return res.status(200).json({
      ok: true,
      visitaId: visita?.id,
      riesgo: riesgo.nivel,
      residente: {
        nombre: residente.nombre,
        direccion: residente.direccion
      },
      empresa: empresa ? {
        nombre: empresa.nombre,
        rubro: empresa.rubro,
        verificada: true
      } : null
    })

  } catch (error) {
    console.error('Error en /api/scan:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
