import { supabaseAdmin } from '../../lib/supabase'

function generarCodigo(nombreEmpresa) {
  const prefix = nombreEmpresa
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 3)
    .padEnd(3, 'X')
  const num = Math.floor(1000 + Math.random() * 8999)
  return `${prefix}-${num}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const {
    nombre,
    rubro,
    antiguedad,
    telefono,
    contacto_previo,
    cobro_efectivo,
    identificacion,
    datos_bancarios
  } = req.body

  if (!nombre || !rubro || !telefono) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  // Verificar que no exista empresa con el mismo teléfono
  const { data: existente } = await supabaseAdmin
    .from('empresas')
    .select('codigo')
    .eq('telefono', telefono)
    .single()

  if (existente) {
    return res.status(409).json({
      error: 'Ya existe una empresa registrada con ese teléfono',
      codigo: existente.codigo
    })
  }

  // Generar código único
  let codigo
  let intentos = 0
  do {
    codigo = generarCodigo(nombre)
    const { data: col } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('codigo', codigo)
      .single()
    if (!col) break
    intentos++
  } while (intentos < 5)

  // Insertar empresa
  const { data: empresa, error } = await supabaseAdmin
    .from('empresas')
    .insert({
      nombre,
      rubro,
      antiguedad,
      telefono,
      contacto_previo,
      cobro_efectivo,
      identificacion,
      datos_bancarios,
      codigo,
      activa: true,
      creado_en: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error registrando empresa:', error)
    return res.status(500).json({ error: 'Error al registrar la empresa' })
  }

  return res.status(201).json({
    ok: true,
    codigo: empresa.codigo,
    nombre: empresa.nombre,
    rubro: empresa.rubro
  })
}
