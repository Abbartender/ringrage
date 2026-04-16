import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function PantallaResidente() {
  const [alerta, setAlerta] = useState(true) // en demo siempre hay alerta
  const [hablando, setHablando] = useState(false)

  function llamarEmergencia() {
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:911'
    }
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

        {/* Header */}
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
            Hay alguien en la puerta
          </div>
        </div>

        {/* Alerta de riesgo */}
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
                Tu familiar ya fue notificado
              </div>
            </div>
          </div>
        )}

        {/* Video */}
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
            <div style={{ fontSize: '14px' }}>Cámara de la puerta</div>
          </div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#E24B4A',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#fff'
          }}>EN VIVO</div>
        </div>

        {/* Botones principales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

          {/* Hablar */}
          <button
            onClick={() => setHablando(!hablando)}
            style={{
              background: hablando ? '#E1F5EE' : '#fff',
              border: hablando ? '2px solid #5DCAA5' : '1px solid #e0ddd6',
              borderRadius: '16px',
              padding: '20px 12px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎙️</div>
            <div style={{
              fontSize: '17px',
              fontWeight: '600',
              color: hablando ? '#085041' : '#1a1a2e'
            }}>
              {hablando ? 'Hablando...' : 'Hablar'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
              sin abrir
            </div>
          </button>

          {/* Avisar al familiar */}
          <button
            style={{
              background: '#fff',
              border: '1px solid #e0ddd6',
              borderRadius: '16px',
              padding: '20px 12px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📲</div>
            <div style={{ fontSize: '17px', fontWeight: '600', color: '#1a1a2e' }}>
              Avisar
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
              a mi familia
            </div>
          </button>
        </div>

        {/* Botón emergencia */}
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
