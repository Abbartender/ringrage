import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function VisitaPage() {
  const router = useRouter()
  const { residenteId } = router.query

  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState('idle') // idle | cargando | ok | error
  const [respuesta, setRespuesta] = useState(null)

  async function handleScan() {
    if (!residenteId) return
    setEstado('cargando')

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residenteId,
          codigoEmpresa: codigo.trim().toUpperCase() || null,
          videoUrl: null
        })
      })

      const data = await res.json()

      if (res.ok) {
        setRespuesta(data)
        setEstado('ok')
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  const coloresRiesgo = {
    bajo: { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5', label: '✅ Empresa verificada' },
    medio: { bg: '#FAEEDA', text: '#633806', border: '#EF9F27', label: '⚠️ Revisá antes de abrir' },
    alto: { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A', label: '🚨 Alerta de riesgo' }
  }

  return (
    <>
      <Head>
        <title>Ring Rage — Identificate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{
          background: '#1a1a2e',
          borderRadius: '20px',
          padding: '36px 28px',
          maxWidth: '380px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              fontSize: '13px',
              letterSpacing: '0.2em',
              color: '#E24B4A',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>Ring Rage</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff' }}>
              Identificate antes de entrar
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '8px' }}>
              Ingresá el código de tu empresa
            </div>
          </div>

          {estado === 'idle' && (
            <>
              <input
                type="text"
                placeholder="Ej: GAR-4872"
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  fontSize: '22px',
                  fontWeight: '600',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  marginBottom: '12px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />

              <button
                onClick={handleScan}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: '#E24B4A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                Avisar que llegué
              </button>

              <button
                onClick={() => { setCodigo(''); handleScan() }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                No tengo código
              </button>
            </>
          )}

          {estado === 'cargando' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <div>Notificando a la familia...</div>
            </div>
          )}

          {estado === 'ok' && respuesta && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: coloresRiesgo[respuesta.riesgo]?.bg,
                border: `1px solid ${coloresRiesgo[respuesta.riesgo]?.border}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: coloresRiesgo[respuesta.riesgo]?.text
                }}>
                  {coloresRiesgo[respuesta.riesgo]?.label}
                </div>
                {respuesta.empresa && (
                  <div style={{
                    fontSize: '13px',
                    marginTop: '8px',
                    color: coloresRiesgo[respuesta.riesgo]?.text,
                    opacity: 0.8
                  }}>
                    {respuesta.empresa.nombre} · {respuesta.empresa.rubro}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                La familia ya fue notificada. Esperá que te atiendan.
              </div>
            </div>
          )}

          {estado === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>❌</div>
              <div style={{ color: '#F09595', marginBottom: '16px' }}>
                Algo salió mal. Intentá de nuevo.
              </div>
              <button
                onClick={() => setEstado('idle')}
                style={{
                  padding: '12px 24px',
                  background: '#E24B4A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reintentar
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
