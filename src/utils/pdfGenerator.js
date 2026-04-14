import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_COLOR = [59, 130, 246]     // blue-500
const ARMY_COLOR = [74, 222, 128]      // green-400
const CIVILIAN_COLOR = [34, 211, 238]  // cyan-400
const DARK_BG = [17, 19, 24]
const TEXT_PRIMARY = [241, 245, 249]
const TEXT_SECONDARY = [148, 163, 184]

function addHeader(doc, title, subtitle, mode) {
  const color = mode === 'army' ? ARMY_COLOR : mode === 'civilian' ? CIVILIAN_COLOR : BRAND_COLOR

  // Dark header bar
  doc.setFillColor(...DARK_BG)
  doc.rect(0, 0, 210, 28, 'F')

  // Accent line
  doc.setFillColor(...color)
  doc.rect(0, 0, 4, 28, 'F')

  // Title
  doc.setTextColor(...TEXT_PRIMARY)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 12, 12)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...TEXT_SECONDARY)
  doc.text(subtitle, 12, 21)

  // ClinicalMind watermark
  doc.setFontSize(8)
  doc.setTextColor(70, 80, 100)
  doc.text('ClinicalMind — Confidential Clinical Document', 210 - 8, 24, { align: 'right' })

  return 36
}

function addSectionLabel(doc, label, y, color = BRAND_COLOR) {
  doc.setFillColor(...color.map(c => Math.floor(c * 0.15)))
  doc.rect(10, y - 5, 190, 8, 'F')
  doc.setTextColor(...color)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(label.toUpperCase(), 14, y)
  return y + 6
}

function addBodyText(doc, text, y, maxWidth = 186) {
  doc.setTextColor(60, 70, 90)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text || 'Not documented.', maxWidth)
  doc.text(lines, 14, y)
  return y + lines.length * 5 + 4
}

function addFooter(doc, pageNum, totalPages) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(20, 22, 30)
  doc.rect(0, pageHeight - 12, 210, 12, 'F')
  doc.setFontSize(7)
  doc.setTextColor(100, 110, 130)
  doc.text(
    `Page ${pageNum} of ${totalPages}  |  Generated ${new Date().toLocaleString()}  |  CONFIDENTIAL — Do not distribute`,
    105,
    pageHeight - 4,
    { align: 'center' }
  )
}

// ── SOAP Note PDF ─────────────────────────────────────────────────────────────

export function generateSOAPNotePDF(session, client) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const mode = client?.mode || 'civilian'
  const color = mode === 'army' ? ARMY_COLOR : CIVILIAN_COLOR
  const modeLabel = mode === 'army' ? '68X Army Mode' : 'Civilian RBT Mode'

  let y = addHeader(
    doc,
    'Clinical Session Note — SOAP Format',
    `Client ID: ${client?.client_id_number || 'N/A'}  |  Date: ${new Date(session?.session_date).toLocaleDateString()}  |  ${modeLabel}`,
    mode
  )

  // Client info box
  doc.setFillColor(25, 28, 38)
  doc.roundedRect(10, y, 190, 20, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_SECONDARY)
  doc.text(`Client ID: ${client?.client_id_number || 'N/A'}`, 16, y + 7)
  doc.text(`Diagnosis: ${client?.diagnosis || 'Not specified'}`, 16, y + 14)
  doc.text(`Mode: ${modeLabel}`, 120, y + 7)
  doc.text(`Session Date: ${new Date(session?.session_date).toLocaleDateString()}`, 120, y + 14)
  y += 26

  const sections = [
    { label: 'Subjective', content: session?.soap_subjective },
    { label: 'Objective', content: session?.soap_objective },
    { label: 'Assessment', content: session?.soap_assessment },
    { label: 'Plan', content: session?.soap_plan },
  ]

  for (const section of sections) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    y = addSectionLabel(doc, section.label, y, color)
    y = addBodyText(doc, section.content, y)
    y += 4
  }

  // Signature block
  if (y > 240) { doc.addPage(); y = 20 }
  y += 8
  doc.setDrawColor(...color)
  doc.setLineWidth(0.3)
  doc.line(14, y, 100, y)
  doc.line(114, y, 200, y)
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_SECONDARY)
  doc.text('Clinician Signature', 14, y + 5)
  doc.text('Date', 114, y + 5)

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  const filename = `${client?.client_id_number || 'Client'}_SOAPNote_${new Date(session?.session_date).toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// ── Safety Plan PDF ────────────────────────────────────────────────────────────

export function generateSafetyPlanPDF(safetyPlan, client) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const mode = client?.mode || 'civilian'
  const color = mode === 'army' ? ARMY_COLOR : CIVILIAN_COLOR

  let y = addHeader(
    doc,
    'Safety Plan',
    `Client ID: ${client?.client_id_number || 'N/A'}  |  Date: ${new Date(safetyPlan?.created_at).toLocaleDateString()}  |  ${mode === 'army' ? '68X Army' : 'Civilian'}`,
    mode
  )

  // Notice box
  doc.setFillColor(100, 20, 20)
  doc.roundedRect(10, y, 190, 10, 2, 2, 'F')
  doc.setTextColor(255, 200, 200)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT: This safety plan should be reviewed with the clinician and kept accessible at all times.', 105, y + 6.5, { align: 'center' })
  y += 16

  const step = (label, content, isArray = false) => {
    if (y > 255) { doc.addPage(); y = 20 }
    y = addSectionLabel(doc, label, y, color)
    const text = isArray
      ? (Array.isArray(content) ? content.map((c, i) => `${i + 1}. ${c}`).join('\n') : content || 'Not specified')
      : (content || 'Not specified')
    y = addBodyText(doc, text, y)
    y += 3
  }

  step('Step 1: Warning Signs', safetyPlan?.warning_signs, true)
  step('Step 2: Internal Coping Strategies', safetyPlan?.internal_coping, true)

  // Social contacts
  if (y > 240) { doc.addPage(); y = 20 }
  y = addSectionLabel(doc, 'Step 3: Social Contacts for Distraction', y, color)
  const socialContacts = safetyPlan?.social_contacts || []
  const socialText = Array.isArray(socialContacts)
    ? socialContacts.map(c => `${c.name}${c.phone ? ' — ' + c.phone : ''}`).join('\n')
    : 'Not specified'
  y = addBodyText(doc, socialText, y)
  y += 3

  // People to ask
  if (y > 240) { doc.addPage(); y = 20 }
  y = addSectionLabel(doc, 'Step 4: People to Ask for Help', y, color)
  const people = safetyPlan?.people_to_ask || []
  const peopleText = Array.isArray(people)
    ? people.map(c => `${c.name}${c.phone ? ' — ' + c.phone : ''}`).join('\n')
    : 'Not specified'
  y = addBodyText(doc, peopleText, y)
  y += 3

  // Professional contacts
  if (y > 240) { doc.addPage(); y = 20 }
  y = addSectionLabel(doc, 'Step 5: Professional Contacts & Crisis Lines', y, color)
  const proContacts = safetyPlan?.professional_contacts || []
  const proText = Array.isArray(proContacts)
    ? proContacts.map(c => `${c.name}${c.phone ? ' — ' + c.phone : ''}`).join('\n')
    : 'Not specified'
  y = addBodyText(doc, proText, y)
  y += 3

  step('Step 6: Making the Environment Safe', safetyPlan?.environment_safety, true)

  if (mode === 'army') {
    step('Weapon/Firearm Access Assessment', safetyPlan?.weapon_access)
    step('Unit Chaplain', `${safetyPlan?.chaplain_name || ''} — ${safetyPlan?.chaplain_contact || 'Not specified'}`)
    step('Chain of Command', `${safetyPlan?.chain_of_command_name || ''} — ${safetyPlan?.chain_of_command_contact || 'Not specified'}`)

    if (y > 240) { doc.addPage(); y = 20 }
    y = addSectionLabel(doc, 'Veterans Crisis Line', [255, 80, 80], color)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 100, 100)
    doc.text('1-800-273-8255  |  Press 1  |  Text: 838255', 14, y + 4)
    y += 14
  } else {
    if (y > 240) { doc.addPage(); y = 20 }
    y = addSectionLabel(doc, '988 Suicide & Crisis Lifeline', y, [255, 80, 80])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 100, 100)
    doc.text('Call or Text: 988', 14, y + 4)
    y += 14
  }

  // Signature block
  if (y > 240) { doc.addPage(); y = 20 }
  y += 10
  doc.setDrawColor(...color)
  doc.setLineWidth(0.3)
  doc.line(14, y, 95, y)
  doc.line(105, y, 186, y)
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_SECONDARY)
  doc.text('Client Signature', 14, y + 5)
  doc.text('Clinician Signature', 105, y + 5)
  y += 16
  doc.line(14, y, 95, y)
  doc.line(105, y, 186, y)
  doc.text('Date', 14, y + 5)
  doc.text('Date', 105, y + 5)

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  const filename = `${client?.client_id_number || 'Client'}_SafetyPlan_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// ── Staffing Document PDF ─────────────────────────────────────────────────────

export function generateStaffingPDF(content, client) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const mode = client?.mode || 'civilian'
  const color = mode === 'army' ? ARMY_COLOR : CIVILIAN_COLOR

  let y = addHeader(
    doc,
    'Staffing / Supervision Document',
    `Client ID: ${client?.client_id_number || 'N/A'}  |  Generated: ${new Date().toLocaleDateString()}  |  ${mode === 'army' ? '68X Army' : 'Civilian RBT'}`,
    mode
  )

  doc.setTextColor(60, 70, 90)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(content, 186)
  let lineCount = 0
  for (const line of lines) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(line, 14, y)
    y += 5.5
    lineCount++
  }

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  const filename = `${client?.client_id_number || 'Client'}_Staffing_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// ── TXT Export ────────────────────────────────────────────────────────────────

export function exportAsTXT(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatSOAPAsTXT(session, client) {
  return `CLINICAL SESSION NOTE
====================
Client ID: ${client?.client_id_number || 'N/A'}
Date: ${new Date(session?.session_date).toLocaleDateString()}
Mode: ${client?.mode === 'army' ? '68X Army' : 'Civilian RBT'}
Diagnosis: ${client?.diagnosis || 'Not specified'}

SUBJECTIVE:
${session?.soap_subjective || 'Not documented.'}

OBJECTIVE:
${session?.soap_objective || 'Not documented.'}

ASSESSMENT:
${session?.soap_assessment || 'Not documented.'}

PLAN:
${session?.soap_plan || 'Not documented.'}

---
Generated by ClinicalMind — CONFIDENTIAL
${new Date().toLocaleString()}
`
}
