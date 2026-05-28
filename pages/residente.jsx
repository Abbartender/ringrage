import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// Estados de Mario: idle → esperando → consejo → llamada → post1 → post2 → cierreOk / cierreNo

export default function PantallaResidente() {
  const router = useRouter()
  const { id: residenteId } = router.query

  const [residente, setResidente] = useState(null)
  const [contacto, setContacto] = useState(null)
  const [roomUrl, setRoomUrl] = useState(null)
  const [enLlamada, setEnLlamada] = useState(false)
  const [marioEstado, setMarioEstado] = useState('idle')
  const [post1Resp, setPost1Resp] = useState(null)
  const [mostrarConfirm911, setMostrarConfirm911] = useState(false)
  const [chatMode, setChatMode] = useState(false)
  const [mensajesChat, setMensajesChat] = useState([])
  const [inputChat, setInputChat] = useState('')
  const [cargandoChat, setCargandoChat] = useState(false)
  const marioTimerRef = useRef(null)
  const chatBottomRef = useRef(null)

  // Cargar datos del residente y su contacto principal
  useEffect(() => {
    if (!residenteId) return
    supabase
      .from('residentes')
      .select('*, contactos(*)')
      .eq('id', residenteId)
      .single()
      .then(({ data }) => {
        if (data) {
          setResidente(data)
          if (data.contactos?.length > 0) setContacto(data.contactos[0])
        }
      })
  }, [residenteId])

  // Al abrir el link desde WhatsApp, el evento Realtime ya pasó.
  // Buscamos la visita más reciente (últimos 30 min) para mostrar Mario de inmediato.
  useEffect(() => {
    if (!residenteId) return
    const hace30min = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    supabase
      .from('visitas')
      .select('video_url, timestamp')
      .eq('residente_id', residenteId)
      .gte('timestamp', hace30min)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.video_url) {
          setRoomUrl(data.video_url)
          setMarioEstado('esperando')
        }
      })
  }, [residenteId])

  // Suscribirse a nuevas visitas via Supabase Realtime
  useEffect(() => {
    if (!residenteId) return
    const canal = supabase
      .channel(`visitas-residente-${residenteId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'visitas',
        filter: `residente_id=eq.${residenteId}`
      }, (payload) => {
        if (payload.new?.video_url) {
          setRoomUrl(payload.new.video_url)
          // Mario aparece automáticamente a los 4 segundos
          marioTimerRef.current = setTimeout(() => setMarioEstado('esperando'), 4000)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
      if (marioTimerRef.current) clearTimeout(marioTimerRef.current)
    }
  }, [residenteId])

  const nombre = residente?.nombre?.split(' ')[0] || ''
  const hayVisita = !!roomUrl
  const marioActivo = marioEstado !== 'idle'

  function activarMarioManual() {
    if (marioTimerRef.current) clearTimeout(marioTimerRef.current)
    setMarioEstado('esperando')
  }

  function atender() {
    setEnLlamada(true)
    setMarioEstado('llamada')
  }

  function cortar() {
    setEnLlamada(false)
    setMarioEstado('post1')
  }

  function responderPost1(r) {
    setPost1Resp(r)
    setMarioEstado('post2')
  }

  function responderPost2(r) {
    const cierre = post1Resp === 'si' && r === 'si' ? 'cierreOk' : 'cierreNo'
    setMarioEstado(cierre)
    // TODO: llamar a /api/mario-resumen para avisar al familiar
  }

  function llamar911() {
    setMostrarConfirm911(false)
    window.location.href = 'tel:911'
  }

  async function enviarMensajeChat() {
    const texto = inputChat.trim()
    if (!texto || cargandoChat) return

    const nuevosMensajes = [...mensajesChat, { role: 'user', content: texto }]
    setMensajesChat(nuevosMensajes)
    setInputChat('')
    setCargandoChat(true)

    try {
      const res = await fetch('/api/mario-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajes: nuevosMensajes })
      })
      const data = await res.json()
      setMensajesChat(prev => [...prev, { role: 'assistant', content: data.respuesta }])
    } catch {
      setMensajesChat(prev => [...prev, { role: 'assistant', content: 'Perdón, no pude responder. Intentá de nuevo.' }])
    } finally {
      setCargandoChat(false)
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const marioTextos = {
    esperando: `${nombre}, tu contacto no contesta. ¿Esperabas a alguien?`,
    consejo: 'Antes de atender, preguntale quién es. Si no lo conocés, no abras. 👀',
    llamada: 'Estoy acá. Cuando termines de hablar, cortá la llamada.',
    post1: '¿Lo conocías?',
    post2: '¿Sabés para qué vino?',
    cierreOk: 'Perfecto. Ya avisé a tu familia de todo. 😊',
    cierreNo: 'Si no estás segura, no abras. Ya avisé a tu familia. 🙏',
  }

  return (
    <>
      <Head>
        <title>Ring Rage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'system-ui', position: 'relative' }}>

        {/* Iframe de Daily — ocupa toda la pantalla cuando está en llamada */}
        {enLlamada && roomUrl && (
          <iframe
            src={`${roomUrl}?prejoin=false&micEnabled=true&camEnabled=true`}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
          />
        )}

        {/* UI principal — siempre por encima del iframe */}
        <div style={{
          position: 'relative', zIndex: 10,
          maxWidth: '420px', margin: '0 auto',
          padding: '24px 20px', minHeight: '100vh',
          display: 'flex', flexDirection: 'column'
        }}>

          {/* Header — solo cuando no está en llamada */}
          {!enLlamada && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#E24B4A', fontWeight: '600', textTransform: 'uppercase' }}>
                Ring Rage
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                {hayVisita ? '🔔 Alguien en la puerta' : `Hola${nombre ? `, ${nombre}` : ''}`}
              </div>
            </div>
          )}

          {/* Estado sin visita */}
          {!hayVisita && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏠</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>
                {residenteId ? 'Esperando visitas...' : 'Abrí con tu ID: /residente?id=TU_ID'}
              </div>
            </div>
          )}

          {/* Visita activa — panel principal */}
          {hayVisita && !enLlamada && (
            <>
              {/* Card de visita */}
              <div style={{
                background: '#1a1a2e', borderRadius: '16px', padding: '18px',
                marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(226,75,74,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0
                }}>🚪</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Alguien llamó a la puerta</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '3px' }}>
                    Podés hablar con ellos tocando Atender
                  </div>
                </div>
              </div>

              {/* Botón manual de Mario */}
              {marioEstado === 'idle' && (
                <button onClick={activarMarioManual} style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '12px 16px',
                  color: 'rgba(255,255,255,0.45)', fontSize: '14px',
                  cursor: 'pointer', marginBottom: '14px', width: '100%'
                }}>
                  🤖 Hablar con Mario
                </button>
              )}
            </>
          )}

          {/* Burbuja de Mario — estados activos, no en llamada */}
          {marioActivo && !enLlamada && (
            <div style={{
              background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '20px', marginBottom: '14px'
            }}>
              {/* Avatar de Mario */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: '#E24B4A', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', flexShrink: 0
                }}>🤖</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                  MARIO
                </div>
              </div>

              {/* Mensaje */}
              <div style={{ fontSize: '20px', color: '#fff', lineHeight: '1.45', marginBottom: '18px', fontWeight: '500' }}>
                {marioTextos[marioEstado]}
              </div>

              {/* Botones según el estado */}
              {marioEstado === 'esperando' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <BtnMario label="Sí" onClick={() => setMarioEstado('consejo')} primary />
                  <BtnMario label="No" onClick={() => setMarioEstado('consejo')} />
                </div>
              )}
              {marioEstado === 'consejo' && (
                <BtnMario label="Atender ahora" onClick={atender} primary full />
              )}
              {marioEstado === 'post1' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <BtnMario label="Sí" onClick={() => responderPost1('si')} primary />
                  <BtnMario label="No" onClick={() => responderPost1('no')} />
                  <BtnMario label="No estoy segura" onClick={() => responderPost1('nosure')} />
                </div>
              )}
              {marioEstado === 'post2' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <BtnMario label="Sí" onClick={() => responderPost2('si')} primary />
                  <BtnMario label="No" onClick={() => responderPost2('no')} />
                  <BtnMario label="No me quedó claro" onClick={() => responderPost2('nosure')} />
                </div>
              )}
              {(marioEstado === 'cierreOk' || marioEstado === 'cierreNo') && (
                <button
                  onClick={() => setChatMode(true)}
                  style={{
                    width: '100%', padding: '13px', marginTop: '4px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px', color: 'rgba(255,255,255,0.7)',
                    fontSize: '15px', cursor: 'pointer'
                  }}>
                  💬 Seguir hablando con Mario
                </button>
              )}
            </div>
          )}

          {/* Mario mini — flota durante la videollamada */}
          {enLlamada && (
            <div style={{
              position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(12px)',
              borderRadius: '16px', padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              zIndex: 20, maxWidth: '340px', width: 'calc(100% - 40px)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ fontSize: '20px' }}>🤖</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>
                {marioTextos.llamada}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* 3 botones permanentes — siempre visibles cuando hay visita */}
          {hayVisita && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
              paddingBottom: '20px',
              ...(enLlamada ? {
                position: 'fixed', bottom: '20px',
                left: '50%', transform: 'translateX(-50%)',
                width: 'calc(100% - 40px)', maxWidth: '380px',
                zIndex: 20
              } : {})
            }}>
              <BtnIcono
                icon="📞"
                label="Familiar"
                onClick={() => contacto?.telefono && (window.location.href = `tel:${contacto.telefono}`)}
                color="#0d2318"
                border="rgba(93,202,165,0.35)"
              />
              <BtnIcono
                icon={enLlamada ? '📵' : '🎥'}
                label={enLlamada ? 'Cortar' : 'Atender'}
                onClick={enLlamada ? cortar : atender}
                color={enLlamada ? '#2a0d0d' : '#0d1a2a'}
                border={enLlamada ? '#E24B4A' : '#5DCAA5'}
              />
              <BtnIcono
                icon="🚨"
                label="911"
                onClick={() => setMostrarConfirm911(true)}
                color="#2a0d0d"
                border="#E24B4A"
                labelColor="#E24B4A"
              />
            </div>
          )}
        </div>

        {/* Pantalla de chat con Mario */}
        {chatMode && (
          <div style={{
            position: 'fixed', inset: 0, background: '#0f0f1a',
            zIndex: 50, display: 'flex', flexDirection: 'column'
          }}>
            {/* Header del chat */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <button onClick={() => setChatMode(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                fontSize: '22px', cursor: 'pointer', padding: '0 8px 0 0'
              }}>←</button>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#E24B4A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', flexShrink: 0
              }}>🤖</div>
              <div>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>Mario</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Asistente de seguridad</div>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 16px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              {mensajesChat.length === 0 && (
                <div style={{
                  background: '#1a1a2e', borderRadius: '16px 16px 16px 4px',
                  padding: '14px 16px', maxWidth: '85%', alignSelf: 'flex-start'
                }}>
                  <div style={{ fontSize: '17px', color: '#fff', lineHeight: '1.4' }}>
                    ¿Tenés alguna duda sobre lo que pasó? Preguntame lo que quieras. 😊
                  </div>
                </div>
              )}
              {mensajesChat.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  <div style={{
                    background: msg.role === 'user' ? '#E24B4A' : '#1a1a2e',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '12px 16px'
                  }}>
                    <div style={{ fontSize: '17px', color: '#fff', lineHeight: '1.4' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {cargandoChat && (
                <div style={{
                  background: '#1a1a2e', borderRadius: '16px 16px 16px 4px',
                  padding: '14px 16px', maxWidth: '85%', alignSelf: 'flex-start'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>...</div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* 3 botones permanentes en el chat */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <BtnIcono
                icon="📞"
                label="Familiar"
                onClick={() => contacto?.telefono && (window.location.href = `tel:${contacto.telefono}`)}
                color="#0d2318"
                border="rgba(93,202,165,0.35)"
              />
              <BtnIcono
                icon={enLlamada ? '📵' : '🎥'}
                label={enLlamada ? 'Cortar' : 'Atender'}
                onClick={enLlamada ? cortar : atender}
                color={enLlamada ? '#2a0d0d' : '#0d1a2a'}
                border={enLlamada ? '#E24B4A' : '#5DCAA5'}
              />
              <BtnIcono
                icon="🚨"
                label="911"
                onClick={() => setMostrarConfirm911(true)}
                color="#2a0d0d"
                border="#E24B4A"
                labelColor="#E24B4A"
              />
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 16px 28px',
              display: 'flex', gap: '10px', alignItems: 'flex-end'
            }}>
              <textarea
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensajeChat() } }}
                placeholder="Escribí tu pregunta..."
                rows={1}
                style={{
                  flex: 1, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '12px 14px', color: '#fff',
                  fontSize: '16px', resize: 'none', outline: 'none',
                  fontFamily: 'system-ui', lineHeight: '1.4'
                }}
              />
              <button
                onClick={enviarMensajeChat}
                disabled={!inputChat.trim() || cargandoChat}
                style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: inputChat.trim() ? '#E24B4A' : 'rgba(255,255,255,0.08)',
                  border: 'none', color: '#fff', fontSize: '20px',
                  cursor: inputChat.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                ↑
              </button>
            </div>
          </div>
        )}

        {/* Modal confirmación 911 */}
        {mostrarConfirm911 && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px'
          }}>
            <div style={{
              background: '#1a1a2e', borderRadius: '24px', padding: '36px 28px',
              maxWidth: '320px', width: '100%', textAlign: 'center',
              border: '1px solid rgba(226,75,74,0.3)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
                ¿Llamar al 911?
              </div>
              <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                Esto va a conectar con emergencias.
              </div>
              <button onClick={llamar911} style={{
                width: '100%', padding: '16px', background: '#E24B4A',
                color: '#fff', border: 'none', borderRadius: '14px',
                fontSize: '17px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px'
              }}>
                Sí, llamar ahora
              </button>
              <button onClick={() => setMostrarConfirm911(false)} style={{
                width: '100%', padding: '14px', background: 'transparent',
                color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', fontSize: '15px', cursor: 'pointer'
              }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Botón de texto para el chat de Mario
function BtnMario({ label, onClick, primary, full }) {
  return (
    <button onClick={onClick} style={{
      flex: full ? undefined : 1,
      width: full ? '100%' : undefined,
      padding: '13px 14px',
      background: primary ? '#E24B4A' : 'rgba(255,255,255,0.07)',
      color: '#fff',
      border: primary ? 'none' : '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: primary ? '600' : '400',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </button>
  )
}

// Botón grande de ícono (los 3 permanentes)
function BtnIcono({ icon, label, onClick, color, border, labelColor }) {
  return (
    <button onClick={onClick} style={{
      background: color || '#1a1a2e',
      border: `1px solid ${border || 'rgba(255,255,255,0.1)'}`,
      borderRadius: '16px', padding: '18px 8px',
      cursor: 'pointer', textAlign: 'center', color: '#fff'
    }}>
      <div style={{ fontSize: '28px', marginBottom: '5px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: labelColor || 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.03em' }}>
        {label}
      </div>
    </button>
  )
}
