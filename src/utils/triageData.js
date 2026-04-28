export const TRIAGE_STEPS = [
  {
    id: 'presenting_problem',
    section: 'I. Presenting Problem',
    title: 'Presenting Problem',
    questions: [
      'What brings you in today? What is the main issue right now?',
      'How long has this been going on?',
      'Has anything specific happened recently that made things worse?',
      'On a scale of 1–10, how distressing is this right now?',
      'Have you talked to anyone else about this — chain of command, chaplain, family?',
    ],
  },
  {
    id: 'safety_screening',
    section: 'II. Safety Screening',
    title: 'Safety Screening',
    questions: [
      'Are you having any thoughts of hurting yourself or ending your life?',
      'Do you have a plan? Do you have access to a weapon or means?',
      'Any history of suicide attempts or self-harm?',
      'Are you having any thoughts of hurting someone else?',
      'Are you safe right now?',
      'What are your reasons for staying safe?',
    ],
  },
  {
    id: 'level_of_functioning',
    section: 'III. Level of Functioning',
    title: 'Level of Functioning',
    questions: [
      'How is your duty performance? Any issues with attendance or mission readiness?',
      'How are your sleep, appetite, and energy levels?',
      'Are you using alcohol or substances to cope?',
      'How are your relationships at home and in your unit?',
      'Are you able to manage your basic daily responsibilities?',
    ],
  },
  {
    id: 'disposition_referral',
    section: 'IV. Disposition & Referral',
    title: 'Disposition & Referral',
    questions: [
      'Based on assessment: Routine, Urgent, or Emergent level of care?',
      'Refer to: BH Clinic / PCM / Emergency Department / SUDCC / Chaplain / Other.',
      'Does the commander need to be notified? (Duty to warn / safety concern)',
      'Provide psychoeducation and coping resources before client leaves.',
      'Schedule follow-up and document disposition in AHLTA/MHS Genesis.',
    ],
  },
]
