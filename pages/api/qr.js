import QRCode from 'qrcode'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const { residenteId } = req.query

  if (!residenteId) {
    return res.status(400).json({ error: 'residenteId requerido' })
  }

  // Verificar que el residente existe
  const { data: residente } = await supabaseAdmin
    .from('residentes')
    .select('id, nombre')
    .eq('id', residenteId)
    .single()

  if (!residente) {
    return res.status(404).json({ error: 'Residente no encontrado' })
  }

  // La URL que activa el timbre al ser escaneada
  const urlTimbre = `${process.env.NEXT_PUBLIC_BASE_URL}/visita/${residenteId}`

  // Generar QR como imagen PNG
  const qrBuffer = await QRCode.toBuffer(urlTimbre, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff'
    }
  })

  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  return res.send(qrBuffer)
}
