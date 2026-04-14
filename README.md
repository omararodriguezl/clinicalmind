# ClinicalMind

AI-assisted clinical documentation for US Army 68X Mental Health Specialists and civilian RBT practitioners.

## Features

- **Dual Mode** — 68X Army (military SOAP) and Civilian RBT (standard SOAP)
- **Session Recording** — Browser microphone recording with Wake Lock API + localStorage backup
- **AI Transcription** — OpenAI Whisper
- **AI Note Generation** — GPT-4 generates complete SOAP notes from transcription
- **Client Management** — Profiles with diagnosis, mode, Army-specific fields
- **Safety Plan Builder** — Step-by-step guided builder with Army and civilian variants, PDF export
- **Staffing Documents** — GPT-4 analyzes all sessions and generates supervision-ready documents
- **DSM-5 Reference** — Searchable built-in reference + GPT-4 AI consult panel
- **PDF & TXT Export** — Professionally formatted exports for all documents
- **Offline Queue** — Automatic retry when connectivity returns
- **Dark Theme** — Professional SaaS-grade dark UI, mobile-first responsive

---

## Setup

### 1. Clone and install

```bash
cd ClinicalMind
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Get OpenAI API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key (you'll need access to `gpt-4o` and `whisper-1`)
3. Add billing at [platform.openai.com/account/billing](https://platform.openai.com/account/billing)

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=sk-your-key-here   # optional — can be set in app Settings
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B — GitHub integration

1. Push to GitHub
2. Import repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY` (optional)

---

## First-Time App Setup

1. Create an account at your deployed URL
2. Go to **Settings** and enter your OpenAI API key (if not in .env)
3. Set your name, credentials, and default mode
4. Add your first client under **Clients**
5. Start a session under **Sessions → New Session**

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # Button, Modal, Badge, Spinner, etc.
│   ├── layout/       # Sidebar, Header, Layout
│   ├── clients/      # ClientForm
│   ├── recording/    # AudioRecorder, NewSessionWizard
│   ├── safety/       # SafetyPlanBuilder, SafetyPlanViewer
├── hooks/
│   ├── useAuth.js           # Supabase auth context
│   ├── useRecording.js      # MediaRecorder + WakeLock + localStorage backup
│   ├── useClients.js        # Client CRUD
│   ├── useOfflineQueue.js   # Offline retry queue
│   └── useSettings.js       # User settings
├── pages/
│   ├── Dashboard.jsx
│   ├── Clients.jsx / ClientDetail.jsx
│   ├── Sessions.jsx / SessionDetail.jsx
│   ├── SafetyPlans.jsx
│   ├── Staffing.jsx
│   ├── DSMReference.jsx
│   └── Settings.jsx
├── utils/
│   ├── supabase.js      # All DB operations
│   ├── openai.js        # Whisper + GPT-4 calls
│   ├── pdfGenerator.js  # jsPDF exports
│   └── constants.js     # DSM-5 data, step configs, crisis resources
└── styles/
    └── globals.css      # Tailwind + custom tokens
supabase/
└── schema.sql           # Full Supabase schema with RLS
```

---

## Privacy & Security

- All client data stored in **your** Supabase project with row-level security
- Audio is processed in-browser and sent directly to OpenAI — never stored
- PDF exports use **client ID numbers**, not full names
- API keys are stored in your Supabase account, not on any third-party server
- Always obtain **informed consent** before recording clients

---

## Crisis Resources

| Resource | Contact |
|---|---|
| Veterans Crisis Line | 1-800-273-8255, press 1 |
| Veterans Crisis Text | Text 838255 |
| 988 Suicide & Crisis Lifeline | Call or text 988 |
| Crisis Text Line | Text HOME to 741741 |
| Military OneSource | 1-800-342-9647 |

---

*ClinicalMind is a personal professional tool. Ensure compliance with HIPAA, state licensing board requirements, and DoD/Army regulations for your practice.*
