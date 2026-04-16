import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function VisitaPage() {
  const router = useRouter()
  const { residenteId } = router.query
  const [estado, setEstado] = useState('idle')
  const [codigo, setCodigo] = useState('')
  const [respuesta, setRespuesta] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (estado === 'video' && videoRef.current && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(stream => {
          streamRef.current = stream
          videoRef.current.srcObject = stream
        })
        .catch(() => setEstado('error'))
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [estado])

  async function handleScan() {
    if (!residenteId) return
    setEstado('cargando')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residenteId, codigoEmpresa: codigo.trim().toUpperCase() || null })
      })
      const data = await res.json()
      if (res.ok) { setRespuesta(data); setEstado('video') }
      else setEstado('error')
    } catch { setEstado('error') }
  }

  const colores = {
    bajo: { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5', label: '✅ Empresa verificada' },
    medio: { bg: '#FAEEDA', text: '#633806', border: '#EF9F27', label: '⚠️ Revisá antes de abrir' },
    alto: { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A', label: '🚨 Alerta de riesgo' }
  }

  return (
    <>
      <Head><title>Ring Rage</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui' }}>
        <div style={{ background: '#1a1a2e', borderRadius: '20px', padding: '36px 28px', maxWidth: '380px', width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: '#E24B4A', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Ring Rage</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff' }}>Identificate antes de entrar</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '8px' }}>Tu imagen será enviada al familiar</div>
          </div>

          {estado === 'idle' && (
            <>
              <input type="text" placeholder="Código de empresa (opcional)" value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                style={{ width: '100%', boxSizing: 'border-box', padding: '16px', fontSize: '18px', fontWeight: '600', letterSpacing: '4px', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none', fontFamily: 'monospace' }} />
              <button onClick={handleScan} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '600', background: '#E24B4A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '12px' }}>
                Activar cámara y avisar
              </button>
              <button onClick={() => { setCodigo(''); handleScan() }} style={{ width: '100%', padding: '12px', fontSize: '14px', background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' }}>
                No tengo código
              </button>
            </>
          )}

          {estado === 'cargando' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <div>Conectando...</div>
            </div>
          )}

          {estado === 'video' && (
            <div style={{ textAlign: 'center' }}>
              {respuesta && (
                <div style={{ background: colores[respuesta.riesgo]?.bg, border: `1px solid ${colores[respuesta.riesgo]?.border}`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: colores[respuesta.riesgo]?.text }}>{colores[respuesta.riesgo]?.label}</div>
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', transform: 'scaleX(-1)' }} />
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>📹 El familiar te está viendo en vivo</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Mostrá tu cara, tu credencial o el paquete</div>
            </div>
          )}

          {estado === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>❌</div>
              <div style={{ color: '#F09595', marginBottom: '16px' }}>Algo salió mal. Intentá de nuevo.</div>
              <button onClick={() => setEstado('idle')} style={{ padding: '12px 24px', background: '#E24B4A', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>Reintentar</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
