import QRCode from 'qrcode'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const { residenteId } = req.query

  if (!residenteId) {
    return res.status(400).json({ error: 'residenteId requerido' })
  }

  const urlTimbre = `https://ringrage.vercel.app/visita/${residenteId}`

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
