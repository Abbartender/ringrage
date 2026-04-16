import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function VisitaPage() {
  const router = useRouter()
  const { residenteId } = router.query
  const [estado, setEstado] = useState('idle')
  const [codigo, setCodigo] = useState('')
  const [respuesta, setRespuesta] = useState(null)
  const [roomUrl, setRoomUrl] = useState(null)
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
        body: JSON.stringify({
          residenteId,
          codigoEmpresa: codigo.trim().toUpperCase() || null,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setRespuesta(data)
        setRoomUrl(data.roomUrl)
        setEstado('video')
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
        <meta
