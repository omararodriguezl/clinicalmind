export const INTAKE_STEPS = [
  // ── OPENING ──────────────────────────────────────────────────────────────
  {
    id: 'opening_intro',
    section: 'Opening',
    title: 'Introduction & Consent',
    instruction: 'Verify identity, introduce yourself, and explain the purpose of the interview.',
    questions: [
      'Can you verify your full name and date of birth?',
      'How has your day been so far?',
      'The purpose of today is to gather information about what brought you in and create a treatment plan. It will take 45–60 minutes. Any questions before we start?',
      'Please read and sign the Privacy Act statement.',
      'Just so you are aware — content is confidential, but I am required to report: physical/sexual/emotional abuse, neglect, danger to self or others, and UCMJ violations.',
    ],
  },

  // ── HISTORY OF PRESENTING PROBLEM ─────────────────────────────────────
  {
    id: 'hpp_presenting',
    section: 'I. History of Presenting Problem',
    title: 'What Brought You In',
    questions: [
      'What exactly brought you into the clinic today?',
      'Was there any major negative or distressing event that made you decide to seek help?',
    ],
  },
  {
    id: 'hpp_distress',
    section: 'I. History of Presenting Problem',
    title: 'Distress History',
    instruction: 'Distress = anything causing anxiety, worry, or emotional pain that impairs performance.',
    questions: [
      'Starting from the beginning, describe every instance when you felt distressed as a result of this problem.',
      'Describe any symptoms you\'ve been experiencing — physical, emotional, social, or otherwise.',
      'How would you say your current state of well-being is overall?',
    ],
  },
  {
    id: 'hpp_treatment_history',
    section: 'I. History of Presenting Problem',
    title: 'Prior Mental Health Treatment',
    questions: [
      'Have you ever been treated by a psychiatrist or psychiatric nurse practitioner in an outpatient setting? If yes, how was it?',
      'Have you ever been treated by a psychologist, licensed social worker, or counselor? If yes, how was it?',
      'Have you ever been admitted to a psychiatric hospital or inpatient mental health facility? If yes, how was it?',
    ],
  },
  {
    id: 'hpp_substance_history',
    section: 'I. History of Presenting Problem',
    title: 'Prior Substance Treatment',
    questions: [
      'Have you ever been treated by an outpatient substance abuse counselor or been in a group like AA or NA?',
      'Have you ever been admitted to an inpatient substance abuse facility or detox center?',
      'Have you ever taken prescription medications specifically for mental health reasons? If yes, what were they?',
      'How would you describe your previous relationships with any psychiatric, mental health, or substance abuse providers?',
    ],
  },
  {
    id: 'hpp_family_history',
    section: 'I. History of Presenting Problem',
    title: 'Family Mental Health History',
    questions: [
      'Does anyone in your immediate family have a history of mental illness or mental health treatment?',
      'Does anyone in your extended family have a history of mental illness or mental health treatment?',
      'Does anyone in your immediate family have a history of substance abuse or substance abuse treatment?',
      'Does anyone in your extended family have a history of substance abuse or substance abuse treatment?',
    ],
  },

  // ── CURRENT FUNCTIONING — MOOD ─────────────────────────────────────────
  {
    id: 'cf_mood',
    section: 'II. Current Functioning — Mood',
    title: 'Current & Prior Mood',
    instruction: 'Transition: "We will now assess your current functioning, starting with mood."',
    questions: [
      'How would you describe your current mood?',
      'Can you elaborate on what you mean by that?',
      'On a scale of 1–10, how would you rate your current mood?',
      'How would you describe your overall mood prior to this problem?',
      'On the same scale, how would you rate your mood before the problem started?',
    ],
  },

  // ── CURRENT FUNCTIONING — RELATIONSHIPS ───────────────────────────────
  {
    id: 'cf_relationships_partner',
    section: 'II. Current Functioning — Relationships',
    title: 'Relationship with Significant Other',
    questions: [
      'How would you describe your current relationship with your significant other?',
      'How was your relationship with your significant other before this problem?',
      'What does your relationship history look like prior to your current significant other?',
    ],
  },
  {
    id: 'cf_relationships_work_family',
    section: 'II. Current Functioning — Relationships',
    title: 'Coworkers & Family',
    questions: [
      'How would you describe your current relationship with your coworkers?',
      'How was your relationship with coworkers before the problem?',
      'How would you describe your current relationship with your family members?',
      'How was your relationship with family members prior to the problem?',
    ],
  },
  {
    id: 'cf_relationships_friends',
    section: 'II. Current Functioning — Relationships',
    title: 'Friends & Social Support',
    questions: [
      'How would you describe your current relationship with your friends?',
      'How was your relationship with friends before the problem started?',
    ],
  },

  // ── CURRENT FUNCTIONING — MENTAL HEALTH ───────────────────────────────
  {
    id: 'cf_mental_health',
    section: 'II. Current Functioning — Mental Health',
    title: 'Mental Health Status',
    questions: [
      'How would you report the current state of your mental health?',
      'How was your mental health prior to this problem?',
    ],
  },
  {
    id: 'cf_screeners',
    section: 'II. Current Functioning — Screenings',
    title: 'Screening Tools Review',
    instruction: 'Reference completed screening tools. Results will be discussed with provider.',
    questions: [
      'Thank you for completing the PHQ-9 (depression screening). Results will be shared with my provider.',
      'Thank you for completing the PCL-5 (PTSD screening). Results will be shared with my provider.',
      'Thank you for completing the GAD-7 (anxiety screening). Results will be shared with my provider.',
    ],
  },

  // ── CURRENT FUNCTIONING — SOCIAL ──────────────────────────────────────
  {
    id: 'cf_social',
    section: 'II. Current Functioning — Social',
    title: 'Hobbies & Social Activities',
    questions: [
      'What hobbies have you had over your lifetime?',
      'How often do you currently engage in these hobbies? About how many hours per week?',
      'How often were you doing these hobbies prior to the problem?',
      'Are you in any clubs, organizations, or non-religious groups?',
    ],
  },

  // ── CURRENT FUNCTIONING — WORK ────────────────────────────────────────
  {
    id: 'cf_work',
    section: 'II. Current Functioning — Work',
    title: 'Work Performance',
    questions: [
      'How would you characterize your current work performance?',
      'On a scale of 1–10 (1 = worst, 10 = best), how would you rate your current work performance?',
      'How would you characterize your work performance before the problem?',
      'Using the same scale, how would you rate your work performance prior to the problem?',
    ],
  },
  {
    id: 'cf_strengths',
    section: 'II. Current Functioning — Strengths',
    title: 'Strengths & Resilience',
    questions: [
      'What would you say are some strengths you have?',
      'How did you overcome barriers that you\'ve faced in the past?',
      'Tell me about a time since the problem started where things were going well. What were you doing to make that happen?',
      'Can you tell me about any weaknesses you think you may have?',
    ],
  },

  // ── MEDICAL HISTORY ────────────────────────────────────────────────────
  {
    id: 'med_reproductive',
    section: 'III. Medical History',
    title: 'Reproductive & Sexual Health',
    instruction: 'Remind the client some questions may feel personal but give an overall picture.',
    questions: [
      'Have you ever engaged in unsafe or unprotective sex practices?',
      'Have you ever been diagnosed with a sexually transmitted infection or disease?',
      'Can you explain any pregnancies you have experienced? When?',
      'Have you ever had an abortion or miscarriage? When?',
    ],
  },
  {
    id: 'med_physical',
    section: 'III. Medical History',
    title: 'Physical Health & Pain',
    questions: [
      'How would you characterize your current physical health?',
      'Have you ever been treated for a medical problem or illness? What type of treatment?',
      'Are you currently feeling any aches or pains anywhere?',
      'If yes: Where is the pain? On a scale of 1–10 how bad is it? How often? When did it start? How long does it last? What relieves it?',
      'Have you seen a medical provider about this pain? What happened?',
    ],
  },
  {
    id: 'med_medications',
    section: 'III. Medical History',
    title: 'Medications & Supplements',
    questions: [
      'Are you currently taking any prescription medication? If yes: How long? What dose? How often?',
      'Are you currently taking any over-the-counter drugs, vitamins, minerals, or supplements? If yes: How long? Dose? How often?',
      'Are you currently being treated by any medical professionals?',
    ],
  },

  // ── APPETITE ──────────────────────────────────────────────────────────
  {
    id: 'med_appetite',
    section: 'III. Medical History — Appetite',
    title: 'Appetite & Nutrition',
    questions: [
      'Describe your current appetite.',
      'About how many meals have you been eating per day for the last two weeks?',
      'How would you describe your appetite prior to the problem?',
      'Prior to the problem, how many meals a day would you eat?',
      'How would you describe the quality of your current diet?',
      'Have you unintentionally gained or lost weight in the last three months? How much?',
      'In the last three months, have you had periods of eating much more than most people would in a similar timeframe?',
      'Do you have any food or drug allergies?',
    ],
  },

  // ── SUBSTANCES ────────────────────────────────────────────────────────
  {
    id: 'med_substance_alcohol',
    section: 'III. Medical History — Substances',
    title: 'Alcohol Use',
    instruction: 'Reference completed AUDIT screening tool.',
    questions: [
      'Thank you for completing the AUDIT (alcohol screening). Results will be shared with my provider.',
      'Are you currently drinking alcohol? If yes: What kind? How many per occasion? What size? How often?',
    ],
  },
  {
    id: 'med_substance_tobacco_caffeine',
    section: 'III. Medical History — Substances',
    title: 'Tobacco & Caffeine',
    questions: [
      'Are you currently using any tobacco products? What kind? How much? How often?',
      'Are you currently using any caffeine products? What kind? How many? What size? How often?',
    ],
  },
  {
    id: 'med_substance_illicit',
    section: 'III. Medical History — Substances',
    title: 'Illicit Drug Use',
    questions: [
      'Are you currently using any illicit drugs? What type? How much? How often?',
    ],
  },

  // ── SLEEP & EXERCISE ──────────────────────────────────────────────────
  {
    id: 'med_sleep_exercise',
    section: 'III. Medical History — Sleep & Exercise',
    title: 'Sleep & Physical Activity',
    questions: [
      'Describe your current quality of sleep over the last two weeks.',
      'About how many hours of sleep do you get each night?',
      'How was your sleep prior to the problem? How many hours per night?',
      'On a scale of 1–10 (1 = sedentary, 10 = peak fitness), how would you rate your physical fitness?',
      'What type of physical activity do you do at least once a week? How many minutes/hours per week?',
    ],
  },

  // ── SOCIAL & FAMILY HISTORY ───────────────────────────────────────────
  {
    id: 'sfh_background',
    section: 'IV. Social & Family History',
    title: 'Childhood & Upbringing',
    instruction: 'Transition: "Social and family history plays a huge role in how we cope in adulthood."',
    questions: [
      'Tell me about the neighborhood and city you grew up in.',
      'How would you describe your childhood overall?',
      'Can you list all the family members and non-family members who lived with you while growing up?',
      'What jobs did your mother and father have while you were growing up?',
    ],
  },
  {
    id: 'sfh_family',
    section: 'IV. Social & Family History',
    title: 'Family Members',
    questions: [
      'How old are your parents now? What do your siblings currently do? How old are they?',
      'How were you disciplined growing up?',
      'Were you ever teased or bullied by classmates, neighbors, or siblings? How so?',
      'While growing up, did you lose any relatives, family members, or close friends? Who?',
    ],
  },
  {
    id: 'sfh_abuse',
    section: 'IV. Social & Family History',
    title: 'Adverse Childhood Experiences',
    instruction: 'These questions are sensitive. Proceed with care and compassion.',
    questions: [
      'Describe any physical abuse you experienced as a child.',
      'Describe any sexual abuse you experienced as a child.',
      'Describe any emotional abuse you experienced as a child.',
      'As a child, did you hear, witness, or directly experience any domestic violence? Describe.',
      'Describe any neglect you experienced as a child.',
    ],
  },
  {
    id: 'sfh_education',
    section: 'IV. Social & Family History',
    title: 'Education',
    questions: [
      'What is the highest level of education you received? What was your GPA?',
      'Tell me about your current educational goals.',
    ],
  },
  {
    id: 'sfh_employment',
    section: 'IV. Social & Family History',
    title: 'Employment History',
    questions: [
      'Beginning with your first job, tell me about any civilian and military jobs you\'ve held over your lifetime.',
      'Why did you leave each job?',
      'Regarding your current workplace, how would you describe your current level of satisfaction?',
    ],
  },
  {
    id: 'sfh_military',
    section: 'IV. Social & Family History',
    title: 'Military / Deployment History',
    instruction: 'Army clients only — skip for civilian.',
    questions: [
      'From earliest to most recent, tell me about any deployments you\'ve had in your military career.',
      'How has each deployment positively and negatively affected you?',
    ],
  },
  {
    id: 'sfh_legal_financial',
    section: 'IV. Social & Family History',
    title: 'Legal & Financial',
    questions: [
      'Do you have any pending Article 15s or criminal charges?',
      'Describe any current legal problems you\'re dealing with.',
      'Describe any financial issues you\'re going through.',
    ],
  },
  {
    id: 'sfh_spiritual',
    section: 'IV. Social & Family History',
    title: 'Spiritual & Religious History',
    questions: [
      'Tell me about any spiritual or religious beliefs you\'ve held over your lifetime.',
      'Have you ever converted religions? How so?',
      'Tell me about any instances in which you lost faith.',
      'Describe any positive or negative impacts your faith community has had on you.',
    ],
  },

  // ── RISK ASSESSMENT ───────────────────────────────────────────────────
  {
    id: 'risk_assessment',
    section: 'V. Risk Assessment',
    title: 'Suicide Risk Screening',
    instruction: 'Reference completed Baseline Suicide Risk Screening form. Use the WWPAM framework for follow-up.',
    questions: [
      'Thank you for completing the Baseline Suicide Risk Screening. I see you circled some items — I\'ll be asking follow-up questions now.',
      'WHEN: Can you remember when you had this thought?',
      'WHAT: What caused you to have this thought?',
      'PLAN: Did you have a plan to carry out this thought?',
      'ACTION: Did you take any action toward carrying out this thought?',
      'MEANS: Did you have the means to carry out your plan?',
    ],
  },

  // ── TREATMENT PLAN ────────────────────────────────────────────────────
  {
    id: 'tx_plan_barriers',
    section: 'VI. Treatment Plan',
    title: 'Barriers to Care',
    instruction: 'Thank the client for their cooperation. Now develop a preliminary treatment plan.',
    questions: [
      'Are there any barriers that may make it difficult to receive BH care? (transportation, hearing impairments, upcoming deployments, language barriers)',
    ],
  },
  {
    id: 'tx_plan_goals',
    section: 'VI. Treatment Plan',
    title: 'Goals & Next Steps',
    instruction: 'Goals = broad outcomes. Objectives = small steps toward the goal.',
    questions: [
      'What is something you\'d like to work towards while in treatment?',
      'What are some things you can do on your own until your next appointment? (Get specific: time of day, how often)',
      'Prior to speaking with my provider, we developed a treatment goal for you. Could you tell me what it was?',
      'And what activities did we agree on you doing on your own until next time?',
    ],
  },
  {
    id: 'tx_closing',
    section: 'VI. Treatment Plan',
    title: 'Closing',
    instruction: 'Step out to consult with provider (~10 minutes), then return.',
    questions: [
      'I\'m going to step out and discuss your information with my provider. I\'ll be back in about 10 minutes.',
      'If you find yourself struggling with suicidal thoughts, homicidal thoughts, or thoughts of harming yourself or others — please alert staff immediately.',
      'Thank you for your patience and cooperation. Do you have any questions before we end?',
      'It was great getting to know you. I look forward to seeing you next week!',
    ],
  },
]
