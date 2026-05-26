import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function PantallaResidente() {
  const router = useRouter()
  const { id: residenteId } = router.query

  const [alerta, setAlerta] = useState(false)
  const [roomUrl, setRoomUrl] = useState(null)
  const [hablando, setHablando] = useState(false)
  const canalRef = useRef(null)

  useEffect(() => {
    if (!residenteId) return

    // Suscribirse a nuevas visitas para este residente
    const canal = supabase
      .channel(`visitas-residente-${residenteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitas',
          filter: `residente_id=eq.${residenteId}`
        },
        (payload) => {
          const visita = payload.new
          if (visita.video_url) {
            setRoomUrl(visita.video_url)
            setAlerta(true)
          }
        }
      )
      .subscribe()

    canalRef.current = canal

    return () => {
      supabase.removeChannel(canal)
    }
  }, [residenteId])

  function llamarEmergencia() {
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:911'
    }
  }

  // Cuando hay una visita activa, mostrar el video
  if (roomUrl) {
    return (
      <>
        <Head>
          <title>Ring Rage — Visita</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <iframe
          src={`${roomUrl}?prejoin=false&micEnabled=true&camEnabled=true`}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
        <button
          onClick={llamarEmergencia}
          style={{
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            background: '#E24B4A', color: '#fff', border: 'none', borderRadius: '12px',
            padding: '14px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            zIndex: 9999, boxShadow: '0 4px 20px rgba(226,75,74,0.5)'
          }}
        >
          🚨 Llamar al 911
        </button>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Ring Rage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#f8f7f4',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '400px',
        margin: '0 auto'
      }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: '#E24B4A',
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>Ring Rage</div>
          <div style={{ fontSize: '26px', fontWeight: '600', color: '#1a1a2e' }}>
            Esperando visitas...
          </div>
          {!residenteId && (
            <div style={{ fontSize: '13px', color: '#999', marginTop: '6px' }}>
              Abrí este link con tu ID: /residente?id=TU_ID
            </div>
          )}
        </div>

        {alerta && (
          <div style={{
            background: '#FAEEDA',
            border: '1px solid #EF9F27',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ fontSize: '20px' }}>⚠️</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#633806' }}>
                Revisá antes de abrir
              </div>
              <div style={{ fontSize: '13px', color: '#854F0B', marginTop: '2px' }}>
                Conectando con la visita...
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: '#1a1a2e',
          borderRadius: '16px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '14px' }}>
              {residenteId ? 'Aguardando visita...' : 'Cámara de la puerta'}
            </div>
          </div>
          {residenteId && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: '#5DCAA5',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#fff'
            }}>CONECTADO</div>
          )}
        </div>

        <button
          onClick={llamarEmergencia}
          style={{
            background: '#FCEBEB',
            border: '2px solid #E24B4A',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#791F1F' }}>
            🚨 Emergencia — Llamar al 911
          </div>
          <div style={{ fontSize: '13px', color: '#A32D2D', marginTop: '4px' }}>
            Presioná y soltá para llamar
          </div>
        </button>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#bbb' }}>
          Ring Rage · tu familia siempre al tanto
        </div>

      </div>
    </>
  )
}
