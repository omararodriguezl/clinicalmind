export const APP_NAME = 'ClinicalMind'

export const MODES = {
  ARMY: 'army',
  CIVILIAN: 'civilian',
}

export const MODE_LABELS = {
  army: '68X Army',
  civilian: 'Civilian RBT',
}

export const MODE_COLORS = {
  army: {
    accent: 'text-army',
    badge: 'bg-army-muted text-army-text border border-army-border',
    button: 'bg-army-muted hover:bg-army-border text-army-text border border-army-border',
    glow: 'shadow-glow-army',
    bg: 'bg-army-bg',
  },
  civilian: {
    accent: 'text-civilian',
    badge: 'bg-civilian-muted text-civilian-text border border-civilian-border',
    button: 'bg-civilian-muted hover:bg-civilian-border text-civilian-text border border-civilian-border',
    glow: 'shadow-glow-civilian',
    bg: 'bg-civilian-bg',
  },
}

export const SAFETY_PLAN_STEPS = [
  {
    id: 'warning_signs',
    label: 'Warning Signs',
    description: 'What thoughts, images, moods, situations, or behaviors indicate a crisis may be developing?',
    prompt: 'What are the warning signs that a crisis may be coming on? (thoughts, feelings, behaviors)',
    type: 'list',
  },
  {
    id: 'internal_coping',
    label: 'Internal Coping Strategies',
    description: 'Things I can do on my own to distract from the crisis.',
    prompt: 'What are some things you can do on your own to distract yourself when you are in crisis?',
    type: 'list',
  },
  {
    id: 'social_contacts',
    label: 'Social Contacts for Distraction',
    description: 'People and places that can provide distraction.',
    prompt: 'Who are people you can contact or places you can go for social support and distraction?',
    type: 'contacts',
  },
  {
    id: 'people_to_ask',
    label: 'People to Ask for Help',
    description: 'People I can ask for help during a crisis.',
    prompt: 'Who are specific people you can ask for help if you are in crisis?',
    type: 'contacts',
  },
  {
    id: 'professional_contacts',
    label: 'Professional Contacts & Crisis Lines',
    description: 'Mental health professionals and crisis services.',
    prompt: 'What mental health professionals or crisis services can you contact?',
    type: 'professional',
    defaults: [
      { name: 'National Suicide Prevention Lifeline', phone: '988' },
      { name: 'Crisis Text Line', phone: 'Text HOME to 741741' },
    ],
  },
  {
    id: 'environment_safety',
    label: 'Making the Environment Safe',
    description: 'Steps to reduce access to lethal means.',
    prompt: 'What steps can be taken to make your environment safer?',
    type: 'list',
  },
]

export const ARMY_SAFETY_ADDITIONS = [
  {
    id: 'weapon_access',
    label: 'Weapon/Firearm Access',
    prompt: 'Do you have access to weapons or firearms? What is the storage situation?',
    type: 'text',
  },
  {
    id: 'chaplain',
    label: 'Unit Chaplain Contact',
    prompt: 'What is your unit chaplain\'s name and contact information?',
    type: 'text',
  },
  {
    id: 'chain_of_command',
    label: 'Chain of Command Contact',
    prompt: 'Who is your immediate supervisor/chain of command contact?',
    type: 'text',
  },
]

export const ARMY_CRISIS_RESOURCES = [
  { name: 'Veterans Crisis Line', phone: '1-800-273-8255 (press 1)', text: 'Text 838255' },
  { name: 'Military OneSource', phone: '1-800-342-9647' },
  { name: 'Army Suicide Prevention', url: 'www.armyg1.army.mil/hr/suicide' },
]

export const CIVILIAN_CRISIS_RESOURCES = [
  { name: 'National Suicide Prevention Lifeline', phone: '988' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741' },
  { name: 'SAMHSA National Helpline', phone: '1-800-662-4357' },
]

export const DSM5_CATEGORIES = [
  'Neurodevelopmental Disorders',
  'Schizophrenia Spectrum and Other Psychotic Disorders',
  'Bipolar and Related Disorders',
  'Depressive Disorders',
  'Anxiety Disorders',
  'Obsessive-Compulsive and Related Disorders',
  'Trauma- and Stressor-Related Disorders',
  'Dissociative Disorders',
  'Somatic Symptom and Related Disorders',
  'Feeding and Eating Disorders',
  'Sleep-Wake Disorders',
  'Sexual Dysfunctions',
  'Disruptive, Impulse-Control, and Conduct Disorders',
  'Substance-Related and Addictive Disorders',
  'Neurocognitive Disorders',
  'Personality Disorders',
  'Paraphilic Disorders',
]

// Built-in DSM-5 quick reference data (subset — GPT-4 can expand)
export const DSM5_QUICK_REF = [
  {
    code: 'F32.1',
    name: 'Major Depressive Disorder, Single Episode, Moderate',
    category: 'Depressive Disorders',
    criteria: 'Five or more symptoms during the same 2-week period, including depressed mood or loss of interest/pleasure. Symptoms: depressed mood, diminished interest, weight change, sleep disturbance, psychomotor changes, fatigue, worthlessness, poor concentration, suicidal ideation.',
    differentials: ['Bipolar Disorder', 'Persistent Depressive Disorder (Dysthymia)', 'Adjustment Disorder with Depressed Mood', 'Bereavement', 'Substance-Induced Depressive Disorder'],
    icd10: 'F32.1',
  },
  {
    code: 'F41.1',
    name: 'Generalized Anxiety Disorder',
    category: 'Anxiety Disorders',
    criteria: 'Excessive anxiety and worry about multiple events/activities for at least 6 months. At least 3 of: restlessness, fatigue, poor concentration, irritability, muscle tension, sleep disturbance.',
    differentials: ['Panic Disorder', 'Social Anxiety Disorder', 'OCD', 'PTSD', 'Adjustment Disorder', 'Medical conditions (hyperthyroidism)'],
    icd10: 'F41.1',
  },
  {
    code: 'F43.10',
    name: 'Post-Traumatic Stress Disorder',
    category: 'Trauma- and Stressor-Related Disorders',
    criteria: 'Exposure to traumatic event; intrusion symptoms; avoidance; negative alterations in cognition/mood; alterations in arousal/reactivity. Duration >1 month. Significant impairment.',
    differentials: ['Acute Stress Disorder', 'Adjustment Disorder', 'Major Depressive Disorder', 'Other Trauma/Stressor Disorders', 'Traumatic Brain Injury'],
    icd10: 'F43.10',
  },
  {
    code: 'F41.0',
    name: 'Panic Disorder',
    category: 'Anxiety Disorders',
    criteria: 'Recurrent unexpected panic attacks followed by persistent concern about future attacks or maladaptive behavior changes for at least 1 month.',
    differentials: ['GAD', 'Social Anxiety', 'PTSD', 'Medical conditions (cardiac arrhythmia, hyperthyroidism)', 'Substance-induced'],
    icd10: 'F41.0',
  },
  {
    code: 'F31.9',
    name: 'Bipolar Disorder, Unspecified',
    category: 'Bipolar and Related Disorders',
    criteria: 'History of manic episode (elevated/expansive/irritable mood, increased energy, decreased sleep need, grandiosity, racing thoughts, distractibility, goal-directed activity, risky behaviors for at least 1 week).',
    differentials: ['Major Depressive Disorder', 'Cyclothymia', 'ADHD', 'Borderline Personality Disorder', 'Substance-Induced Mood Disorder'],
    icd10: 'F31.9',
  },
  {
    code: 'F20.9',
    name: 'Schizophrenia',
    category: 'Schizophrenia Spectrum and Other Psychotic Disorders',
    criteria: 'Two or more: delusions, hallucinations, disorganized speech, disorganized behavior, negative symptoms. Duration ≥6 months including prodrome. Significant impairment.',
    differentials: ['Schizoaffective Disorder', 'Brief Psychotic Disorder', 'Substance-Induced Psychotic Disorder', 'Delusional Disorder', 'Mood Disorder with Psychotic Features'],
    icd10: 'F20.9',
  },
  {
    code: 'F40.10',
    name: 'Social Anxiety Disorder',
    category: 'Anxiety Disorders',
    criteria: 'Marked fear/anxiety about social situations with possible scrutiny. Fear of negative evaluation. Avoidance or endured with distress. Duration ≥6 months.',
    differentials: ['GAD', 'Panic Disorder', 'Agoraphobia', 'Specific Phobia', 'PTSD', 'Autism Spectrum Disorder'],
    icd10: 'F40.10',
  },
  {
    code: 'F42.2',
    name: 'Obsessive-Compulsive Disorder',
    category: 'Obsessive-Compulsive and Related Disorders',
    criteria: 'Obsessions (recurrent, persistent, intrusive thoughts/urges) and/or compulsions (repetitive behaviors to reduce anxiety). Time-consuming (>1hr/day) or significant impairment.',
    differentials: ['GAD', 'MDD', 'Eating Disorders', 'Body Dysmorphic Disorder', 'Hoarding Disorder', 'Trichotillomania'],
    icd10: 'F42.2',
  },
  {
    code: 'F90.2',
    name: 'ADHD, Combined Presentation',
    category: 'Neurodevelopmental Disorders',
    criteria: 'Inattention (≥6 symptoms) AND hyperactivity-impulsivity (≥6 symptoms). Symptoms present before age 12. Present in ≥2 settings. Significant impairment.',
    differentials: ['GAD', 'Mood Disorders', 'Specific Learning Disorder', 'Autism Spectrum Disorder', 'Substance Use'],
    icd10: 'F90.2',
  },
  {
    code: 'F60.3',
    name: 'Borderline Personality Disorder',
    category: 'Personality Disorders',
    criteria: 'Pervasive pattern of instability in interpersonal relationships, self-image, and affects with marked impulsivity. Five or more of 9 criteria including: frantic efforts to avoid abandonment, unstable relationships, identity disturbance, impulsivity, suicidal behavior, affective instability, chronic emptiness, inappropriate intense anger, paranoid ideation.',
    differentials: ['Bipolar Disorder', 'PTSD', 'Major Depressive Disorder', 'Histrionic PD', 'Narcissistic PD'],
    icd10: 'F60.3',
  },
  {
    code: 'F43.20',
    name: 'Adjustment Disorder, Unspecified',
    category: 'Trauma- and Stressor-Related Disorders',
    criteria: 'Emotional or behavioral symptoms in response to an identifiable stressor within 3 months. Marked distress or significant impairment. Symptoms do not meet criteria for another mental disorder.',
    differentials: ['MDD', 'PTSD', 'Acute Stress Disorder', 'Bereavement', 'Normal stress response'],
    icd10: 'F43.20',
  },
  {
    code: 'F10.20',
    name: 'Alcohol Use Disorder, Moderate',
    category: 'Substance-Related and Addictive Disorders',
    criteria: '4-5 symptoms within 12 months: drinking more/longer than intended, unsuccessful efforts to cut down, craving, failure to fulfill obligations, social/occupational problems, hazardous use, tolerance, withdrawal.',
    differentials: ['Anxiety Disorders', 'Depressive Disorders', 'Other Substance Use Disorders', 'Bipolar Disorder'],
    icd10: 'F10.20',
  },
]
