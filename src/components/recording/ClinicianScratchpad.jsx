import { useState, useRef, useCallback, useEffect } from 'react'
import { Keyboard, Pencil, Trash2, Save, Loader, CheckCircle } from 'lucide-react'
import { getOpenAIKey } from '../../utils/openai'

const COLORS = [
  { name: 'white', value: '#F0EDE6' },
  { name: 'green', value: '#8FA863' },
  { name: 'blue',  value: '#60A5FA' },
  { name: 'red',   value: '#F87171' },
]

const CANVAS_W = 840
const CANVAS_H = 480
const CANVAS_BG = '#11140F'

async function visionTranscribe(base64, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64 } },
          { type: 'text', text: 'You are a clinical assistant. Transcribe exactly what is handwritten in this image. Return only the transcribed text, no commentary.' },
        ],
      }],
      max_tokens: 1000,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Vision API error')
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export function ClinicianScratchpad({ onSave, onTextChange }) {
  const [mode, setMode]         = useState('keyboard')
  const [text, setText]         = useState('')
  const [penColor, setPenColor] = useState(COLORS[0].value)
  const [tool, setTool]         = useState('pen')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveErr, setSaveErr]   = useState(null)

  const canvasRef  = useRef(null)
  const isDrawing  = useRef(false)
  const lastPos    = useRef(null)
  const canvasInit = useRef(false)

  // Fill canvas background when pencil mode mounts
  useEffect(() => {
    if (mode !== 'pencil') return
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      if (!canvasInit.current) {
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = CANVAS_BG
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        canvasInit.current = true
      }
    })
    return () => cancelAnimationFrame(id)
  }, [mode])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
    }
  }

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    isDrawing.current = true
    lastPos.current = getPos(e)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tool === 'eraser') {
      ctx.strokeStyle = CANVAS_BG
      ctx.lineWidth = 24
    } else {
      ctx.strokeStyle = penColor
      ctx.lineWidth = e.pressure > 0 && e.pressure < 1 ? Math.max(1, e.pressure * 4) : 2
    }
    ctx.stroke()
    lastPos.current = pos
  }, [tool, penColor])

  const onPointerUp = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSaved(false)
  }

  const handleTextChange = (val) => {
    setText(val)
    setSaved(false)
    onTextChange?.(val)
  }

  const handleSave = async () => {
    setSaveErr(null)
    setSaving(true)
    try {
      if (mode === 'keyboard') {
        onSave?.({ text, image: null })
        setSaved(true)
      } else {
        const canvas = canvasRef.current
        const base64 = canvas.toDataURL('image/png')
        const apiKey = getOpenAIKey()
        if (!apiKey) throw new Error('OpenAI API key not configured')
        const transcribed = await visionTranscribe(base64, apiKey)
        onSave?.({ text: transcribed, image: base64 })
        setSaved(true)
      }
    } catch (err) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--cm-line)',
      borderRadius: 2,
      background: 'var(--cm-surface)',
      overflow: 'hidden',
      minHeight: 280,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        borderBottom: '1px solid var(--cm-line)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          letterSpacing: '0.18em', color: 'var(--cm-ink-mute)',
          textTransform: 'uppercase', fontWeight: 600,
        }}>
          NOTES
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setMode('keyboard')}
            title="Keyboard mode"
            style={{
              padding: 4, borderRadius: 2, border: 'none', cursor: 'pointer',
              background: mode === 'keyboard' ? 'var(--cm-od-soft)' : 'transparent',
              color: mode === 'keyboard' ? 'var(--cm-od)' : 'var(--cm-ink-mute)',
            }}
          >
            <Keyboard style={{ width: 13, height: 13 }} />
          </button>
          <button
            onClick={() => setMode('pencil')}
            title="Pencil / Apple Pencil mode"
            style={{
              padding: 4, borderRadius: 2, border: 'none', cursor: 'pointer',
              background: mode === 'pencil' ? 'var(--cm-od-soft)' : 'transparent',
              color: mode === 'pencil' ? 'var(--cm-od)' : 'var(--cm-ink-mute)',
            }}
          >
            <Pencil style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mode === 'keyboard' ? (
          <textarea
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            placeholder="Type session notes here..."
            style={{
              flex: 1, width: '100%', padding: '8px 10px',
              resize: 'none', background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, color: 'var(--cm-ink-soft)', lineHeight: 1.5,
              fontFamily: 'Inter, system-ui, sans-serif',
              minHeight: 180,
            }}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Canvas toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
              borderBottom: '1px solid var(--cm-line)', flexShrink: 0,
            }}>
              {['pen', 'eraser'].map(t => (
                <button
                  key={t}
                  onClick={() => setTool(t)}
                  style={{
                    padding: '1px 6px', fontSize: 10, borderRadius: 2, border: 'none',
                    cursor: 'pointer', fontWeight: 500,
                    background: tool === t ? 'var(--cm-od-soft)' : 'transparent',
                    color: tool === t ? 'var(--cm-od)' : 'var(--cm-ink-mute)',
                  }}
                >
                  {t === 'pen' ? 'Pen' : 'Erase'}
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setPenColor(c.value); setTool('pen') }}
                    title={c.name}
                    style={{
                      width: 11, height: 11, borderRadius: '50%', border: 'none',
                      cursor: 'pointer', background: c.value,
                      outline: penColor === c.value && tool === 'pen'
                        ? '2px solid var(--cm-od)' : '1px solid rgba(255,255,255,0.15)',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
              <button
                onClick={clearCanvas}
                title="Clear canvas"
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--cm-ink-mute)', padding: 2,
                }}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                width: '100%', flex: 1, display: 'block',
                touchAction: 'none',
                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                background: CANVAS_BG,
                minHeight: 160,
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px',
        borderTop: '1px solid var(--cm-line)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          color: 'var(--cm-ink-faint)',
        }}>
          {mode === 'keyboard'
            ? `${wordCount}w`
            : saved ? '✓ transcribed' : 'draw to add notes'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {saveErr && (
            <span style={{ fontSize: 10, color: 'var(--cm-danger)' }}>{saveErr}</span>
          )}
          {saved && !saving && (
            <CheckCircle style={{ width: 12, height: 12, color: '#2D7A4F' }} />
          )}
          <button
            onClick={handleSave}
            disabled={saving || (mode === 'keyboard' && !text.trim())}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', fontSize: 10, fontWeight: 600,
              border: '1px solid var(--cm-od)', color: 'var(--cm-od)',
              background: 'transparent', borderRadius: 2, cursor: 'pointer',
              opacity: saving || (mode === 'keyboard' && !text.trim()) ? 0.4 : 1,
            }}
          >
            {saving
              ? <Loader style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
              : <Save style={{ width: 11, height: 11 }} />}
            {saving ? 'Saving...' : 'Save note'}
          </button>
        </div>
      </div>
    </div>
  )
}
