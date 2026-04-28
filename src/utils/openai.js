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

export async function generateNote(transcription, mode, clientInfo, customPrompt, apiKey, clinicianNotes = '') {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured. Go to Settings to add your key.')

  const systemPrompt = buildNoteSystemPrompt(mode, customPrompt)
  const userMessage = buildNoteUserMessage(transcription, clientInfo, clinicianNotes)

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

// ── Session Feedback (AI Follow-up Questions) ─────────────────────────────────

export async function generateSessionFeedback(transcription, mode, clientInfo, apiKey, clinicianNotes = '') {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured. Go to Settings to add your key.')

  const modeContext =
    mode === 'army'
      ? 'a US Army 68X Mental Health Specialist conducting a behavioral health assessment on a service member'
      : mode === 'triage'
        ? 'a US Army 68X Mental Health Specialist conducting a triage/walk-in behavioral health assessment'
        : 'a behavioral health RBT/clinician conducting a session with a civilian client'

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
          content: `You are a clinical supervision AI assistant helping ${modeContext}.
Your job is to review a session transcription and identify gaps — things that were not explored enough to fully understand the patient's presenting problem.
Provide 5–8 specific follow-up questions the clinician should ask in future sessions to clarify the problem, explore missed areas, or gather critical information.
Format your response as:

CLINICAL OBSERVATIONS:
[2–3 sentences summarizing what was covered and the overall clinical picture]

GAPS IDENTIFIED:
[bullet list of areas not adequately explored]

RECOMMENDED FOLLOW-UP QUESTIONS:
1. [question]
2. [question]
...

Keep questions direct, open-ended, and clinically relevant.`,
        },
        {
          role: 'user',
          content: `Client ID: ${clientInfo.client_id_number}
Diagnosis: ${clientInfo.diagnosis || 'Not yet specified'}
${mode === 'army' || mode === 'triage' ? `Rank/Unit: ${clientInfo.rank || 'N/A'} / ${clientInfo.unit || 'N/A'}` : ''}

Session Transcription:
---
${transcription || 'No audio transcription available.'}
---
${clinicianNotes ? `\nClinician Notes (supplementary observations):\n---\n${clinicianNotes}\n---\n` : ''}
Please analyze this session and provide follow-up questions to better understand the patient's presenting problem.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1200,
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

// ── Group Session Plan Generator ──────────────────────────────────────────────

export async function generateGroupSession(topic, groupType, duration, apiKey) {
  const key = apiKey || getOpenAIKey()
  if (!key) throw new Error('OpenAI API key not configured.')

  const typeLabel = groupType === 'psychoeducational' ? 'Psychoeducational' : 'Process Group'
  const typeGuidance = groupType === 'psychoeducational'
    ? 'structure the session around teaching, skill-building, and concrete takeaways. The facilitator does most of the talking. Include more content to present and a structured activity.'
    : 'structure the session around facilitated discussion, reflection, and shared experience. The facilitator talks less and guides more. Include more open-ended questions, techniques for drawing out participation, and guidance on managing group dynamics.'
  const questionsGuidance = groupType === 'psychoeducational'
    ? 'focus on applying the content'
    : 'focus on deeper reflection and shared experience'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert Army behavioral health group facilitator and licensed mental health clinician. You create structured, evidence-based group counseling session plans for military populations at a Military Treatment Facility. Your plans are practical, trauma-informed, and use plain language appropriate for enlisted soldiers and junior officers.`,
        },
        {
          role: 'user',
          content: `Generate a complete group counseling session plan with the following details:
- Topic: ${topic}
- Group type: ${typeLabel}
- Duration: ${duration} minutes

If Psychoeducational: ${typeGuidance}
If Process Group: ${typeGuidance}

Provide exactly these 7 sections, clearly labeled with these exact headers:

1. SESSION OVERVIEW
A 2-3 sentence summary of the session goals and what participants will leave with.

2. TIMED OUTLINE
A phase-by-phase outline with exact minute allocations that add up to ${duration} minutes total. Phases: Opening & Check-in, [Main Content / Topic Introduction], Activity or Exercise, Discussion & Processing, Closing & Takeaways.

3. FULL FACILITATOR SCRIPT
Everything the facilitator says, word for word, for each phase. Write in first person as if speaking directly to the group. Include transitions between phases. For Process Groups, include specific prompts and follow-up probes.

4. ACTIVITY OR EXERCISE
One structured activity appropriate for the topic and group type. Include the name of the activity, its purpose, step-by-step instructions for running it, and estimated time.

5. PROCESSING QUESTIONS
6-8 open-ended questions to facilitate group discussion. For Psychoeducational groups, ${questionsGuidance}. For Process Groups, ${questionsGuidance}.

6. KEY TAKEAWAYS
3-5 bullet points with the main messages participants should leave with.

7. FACILITATOR NOTES
Clinical tips specific to this topic with a military population: things to watch for, how to handle resistance or silence, common reactions, and any duty-to-warn considerations if relevant.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `GPT-4 API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── Prompt Builders ────────────────────────────────────────────────────────────

function buildNoteSystemPrompt(mode, customPrompt) {
  let base
  if (mode === 'army') {
    base = `You are a US Army 68X Mental Health Specialist documentation assistant.
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
  } else if (mode === 'triage') {
    base = `You are a US Army 68X Mental Health Specialist documentation assistant writing a triage assessment note.
Generate a concise triage SOAP note. In the Plan section include the disposition level (Routine / Urgent / Emergent) and referral destination.
Use military behavioral health terminology.
Be professional, objective, and clinically precise.
Format the response exactly as:
SUBJECTIVE:
[content]

OBJECTIVE:
[content]

ASSESSMENT:
[content]

PLAN:
[content — include Disposition Level and Referral]`
  } else {
    base = `You are a clinical documentation assistant for a behavioral health RBT/clinician.
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
  }
  return customPrompt ? `${base}\n\nAdditional instructions: ${customPrompt}` : base
}

function buildNoteUserMessage(transcription, clientInfo, clinicianNotes = '') {
  const notesSection = clinicianNotes
    ? `\nClinician Notes (supplementary clinical observations):\n---\n${clinicianNotes}\n---\n`
    : ''
  return `Client ID: ${clientInfo.client_id_number}
Mode: ${clientInfo.mode?.toUpperCase()}
Diagnosis: ${clientInfo.diagnosis || 'Not specified'}
${clientInfo.mode === 'army' || clientInfo.mode === 'triage' ? `Rank/Unit: ${clientInfo.rank || 'N/A'} / ${clientInfo.unit || 'N/A'}` : ''}

Session Transcription:
---
${transcription || 'No audio transcription available.'}
---
${notesSection}
Please generate a complete SOAP note based on the available session content.`
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
Plan: ${s.soap_plan || 'N/A'}${s.ai_feedback ? `\nAI Follow-up Recommendations: ${s.ai_feedback}` : ''}`
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
