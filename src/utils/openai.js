// OpenAI API helpers — key is stored per-user in settings (localStorage fallback)

export function getOpenAIKey() {
  return localStorage.getItem('cm_openai_key') || import.meta.env.VITE_OPENAI_API_KEY || ''
}

// ── Transcription (Whisper) ───────────────────────────────────────────────────

export async function transcribeAudio(audioBlob, apiKey) {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured. Go to Settings to add your key.')

  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Whisper API error: ${response.status}`)
  }

  const data = await response.json()
  return data.text
}

// ── Note Generation (GPT-4) ───────────────────────────────────────────────────

export async function generateNote(transcription, mode, clientInfo, customPrompt, apiKey) {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured. Go to Settings to add your key.')

  const systemPrompt = buildNoteSystemPrompt(mode, customPrompt)
  const userMessage = buildNoteUserMessage(transcription, clientInfo)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `GPT-4 API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices[0].message.content
  return parseSOAPNote(text)
}

// ── Staffing Document ─────────────────────────────────────────────────────────

export async function generateStaffingDocument(clientInfo, sessions, mode, customPrompt, apiKey) {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured.')

  const systemPrompt = buildStaffingSystemPrompt(mode, customPrompt)
  const userMessage = buildStaffingUserMessage(clientInfo, sessions)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `GPT-4 API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ── DSM-5 Query ───────────────────────────────────────────────────────────────

export async function queryDSM(question, apiKey) {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured.')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a clinical reference assistant specializing in DSM-5 and ICD-10 diagnostic criteria. Provide accurate, concise clinical information. Format responses with clear headers. Always include relevant ICD-10 codes. Note: this is a clinical reference tool for licensed professionals.',
        },
        { role: 'user', content: question },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `GPT-4 API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ── Prompt Builders ────────────────────────────────────────────────────────────

function buildNoteSystemPrompt(mode, customPrompt) {
  const base =
    mode === 'army'
      ? `You are a US Army 68X Mental Health Specialist documentation assistant.
Generate clinical notes in military SOAP format. Use military behavioral health terminology.
Always include military-specific resources (chaplain, chain of command, Veterans Crisis Line 1-800-273-8255 press 1).
Be professional, objective, and clinically precise.
Format the response exactly as:
SUBJECTIVE:
[content]

OBJECTIVE:
[content]

ASSESSMENT:
[content]

PLAN:
[content]`
      : `You are a clinical documentation assistant for a behavioral health RBT/clinician.
Generate clinical notes in standard SOAP format for civilian behavioral health practice.
Be professional, objective, and clinically precise.
Format the response exactly as:
SUBJECTIVE:
[content]

OBJECTIVE:
[content]

ASSESSMENT:
[content]

PLAN:
[content]`

  return customPrompt ? `${base}\n\nAdditional instructions: ${customPrompt}` : base
}

function buildNoteUserMessage(transcription, clientInfo) {
  return `Client ID: ${clientInfo.client_id_number}
Mode: ${clientInfo.mode?.toUpperCase()}
Diagnosis: ${clientInfo.diagnosis || 'Not specified'}
${clientInfo.mode === 'army' ? `Rank/Unit: ${clientInfo.rank || 'N/A'} / ${clientInfo.unit || 'N/A'}` : ''}

Session Transcription:
---
${transcription}
---

Please generate a complete SOAP note based on this session transcription.`
}

function buildStaffingSystemPrompt(mode, customPrompt) {
  const base =
    mode === 'army'
      ? `You are a US Army 68X Mental Health Specialist preparing a staffing document for clinical supervision.
Generate a comprehensive staffing document using military behavioral health format.
Include: clinical summary, recent session highlights, symptom trajectory, safety status,
military readiness considerations, chain of command recommendations, and clinical questions for supervisor.`
      : `You are a behavioral health clinician preparing a staffing document for clinical supervision.
Generate a comprehensive staffing document for civilian behavioral health practice.
Include: clinical summary, recent session highlights, symptom trajectory, safety status,
treatment progress, and clinical questions for supervisor.`

  return customPrompt ? `${base}\n\nAdditional instructions: ${customPrompt}` : base
}

function buildStaffingUserMessage(clientInfo, sessions) {
  const sessionSummaries = sessions
    .slice(0, 10)
    .map(
      (s, i) => `
Session ${i + 1} (${new Date(s.session_date).toLocaleDateString()}):
Subjective: ${s.soap_subjective || 'N/A'}
Objective: ${s.soap_objective || 'N/A'}
Assessment: ${s.soap_assessment || 'N/A'}
Plan: ${s.soap_plan || 'N/A'}`
    )
    .join('\n---')

  return `Client ID: ${clientInfo.client_id_number}
Mode: ${clientInfo.mode?.toUpperCase()}
Diagnosis: ${clientInfo.diagnosis || 'Not specified'}
Active Safety Plan: ${clientInfo.has_active_safety_plan ? 'YES' : 'No'}
Total Sessions: ${sessions.length}

Recent Sessions:
${sessionSummaries}

Please generate a comprehensive staffing document for clinical supervision.`
}

// ── SOAP Parser ───────────────────────────────────────────────────────────────

export function parseSOAPNote(text) {
  const sections = {
    soap_subjective: '',
    soap_objective: '',
    soap_assessment: '',
    soap_plan: '',
    raw_note: text,
  }

  const patterns = [
    { key: 'soap_subjective', regex: /SUBJECTIVE:\s*([\s\S]*?)(?=OBJECTIVE:|$)/i },
    { key: 'soap_objective', regex: /OBJECTIVE:\s*([\s\S]*?)(?=ASSESSMENT:|$)/i },
    { key: 'soap_assessment', regex: /ASSESSMENT:\s*([\s\S]*?)(?=PLAN:|$)/i },
    { key: 'soap_plan', regex: /PLAN:\s*([\s\S]*?)(?=$)/i },
  ]

  for (const { key, regex } of patterns) {
    const match = text.match(regex)
    if (match) sections[key] = match[1].trim()
  }

  return sections
}
