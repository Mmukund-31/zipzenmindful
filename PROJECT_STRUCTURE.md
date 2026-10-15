# Complete Mental Wellness App - Project Structure

## 🎯 Your Complete Wellness Platform
A fully functional AI-powered mental wellness application with mood tracking, chat assistance, memory management, and stress relief tools.

## 📁 Complete File Structure

```
wellness-app/
├── package.json                 # Dependencies and scripts
├── package-lock.json           # Dependency lock file
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── components.json             # Shadcn UI configuration
├── drizzle.config.ts           # Database configuration
│
├── client/                     # Frontend React Application
│   ├── index.html             # Main HTML file
│   └── src/
│       ├── App.tsx            # Main app component with routing
│       ├── main.tsx           # React entry point
│       ├── index.css          # Global styles and theme
│       │
│       ├── components/        # Reusable UI Components
│       │   ├── breathing-exercise.tsx      # Interactive breathing tool
│       │   ├── daily-wellness-tip.tsx     # AI-powered daily tips
│       │   ├── file-upload.tsx            # Photo upload component
│       │   ├── meme-generator.tsx         # AI meme creation
│       │   ├── memory-video-creator.tsx   # Memory video maker
│       │   ├── mood-selector.tsx          # Mood tracking interface
│       │   ├── navigation.tsx             # App navigation
│       │   ├── theme-provider.tsx         # Dark/light theme
│       │   ├── theme-toggle.tsx           # Theme switcher
│       │   ├── thought-interruptor.tsx    # Overthinking tools
│       │   ├── voice-assistant.tsx        # Voice interaction
│       │   └── ui/                        # Shadcn UI components
│       │       ├── accordion.tsx
│       │       ├── alert-dialog.tsx
│       │       ├── avatar.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── calendar.tsx
│       │       ├── card.tsx
│       │       ├── carousel.tsx
│       │       ├── chart.tsx
│       │       ├── checkbox.tsx
│       │       ├── dialog.tsx
│       │       ├── form.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── select.tsx
│       │       ├── separator.tsx
│       │       ├── sheet.tsx
│       │       ├── sidebar.tsx
│       │       ├── skeleton.tsx
│       │       ├── slider.tsx
│       │       ├── switch.tsx
│       │       ├── tabs.tsx
│       │       ├── textarea.tsx
│       │       ├── toast.tsx
│       │       ├── toaster.tsx
│       │       └── tooltip.tsx
│       │
│       ├── pages/             # Application Pages
│       │   ├── landing.tsx    # Welcome page for logged out users
│       │   ├── dashboard.tsx  # Main dashboard with mood overview
│       │   ├── chat.tsx       # AI chat with voice features
│       │   ├── memories.tsx   # Photo memories and meme creation
│       │   ├── insights.tsx   # Mood analytics and patterns
│       │   ├── wellness.tsx   # Breathing and stress tools
│       │   ├── settings.tsx   # User preferences and theme
│       │   └── not-found.tsx  # 404 error page
│       │
│       ├── hooks/             # Custom React Hooks
│       │   ├── useAuth.ts     # Authentication state
│       │   ├── use-mobile.tsx # Mobile device detection
│       │   └── use-toast.ts   # Toast notifications
│       │
│       └── lib/               # Utilities and Helpers
│           ├── queryClient.ts # TanStack Query setup
│           ├── demoStorage.ts # Local storage utilities
│           ├── openai.ts      # Frontend AI helpers
│           └── utils.ts       # General utilities
│
├── server/                    # Backend Express Application
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes and endpoints
│   ├── storage.ts            # Database operations
│   ├── vite.ts               # Vite development server
│   ├── db.ts                 # Database connection
│   ├── replitAuth.ts         # Authentication setup
│   └── lib/
│       └── openai.ts         # Thin HTTP adapter -> ai-service (see below)
│
├── shared/                   # Shared Types and Schemas
│   └── schema.ts             # Database models and validation
│
└── ai-service/                # Python FastAPI AI microservice (RAG, LangChain, vector DB)
    ├── requirements.txt
    ├── Dockerfile
    ├── README.md              # AI architecture deep-dive
    └── app/
        ├── main.py            # FastAPI app, routers, startup KB ingestion
        ├── config.py          # Settings (LLM provider, API keys, Chroma dir)
        ├── llm.py             # Provider-agnostic Gemini/OpenAI chat + embeddings factory
        ├── vectorstore.py     # Chroma collections: wellness_kb, user_memory
        ├── memory.py          # Short-term buffer + long-term vector conversational memory
        ├── ingest.py          # Embeds knowledge_base/*.md into the vector store
        ├── agent.py           # LangChain tool-calling agent (search KB, recall memory, breathing)
        ├── knowledge_base/    # 19 curated wellness/CBT documents used for RAG retrieval
        ├── chains/            # RAG + generation chains (chat, mood, vision, wellness, insights)
        └── routers/           # /ai/chat, /ai/mood, /ai/memories, /ai/meme, /ai/wellness, /ai/insights
```

The Express server no longer calls any LLM directly — `server/lib/openai.ts` forwards every AI
request over HTTP to `ai-service`, which owns all RAG/agent/vector-DB/LLM logic. See the root
[README.md](README.md) and [ai-service/README.md](ai-service/README.md) for the full architecture.

## 🚀 Key Features Implemented

### 🤖 AI-Powered Features (via the `ai-service` FastAPI/LangChain microservice)
- **RAG-Grounded Chat Assistant** - LangChain tool-calling agent that retrieves from a Chroma
  vector knowledge base and the user's own long-term vector memory before replying, adapting to
  mood and replying in the user's own language (13 Indian + 10 global languages)
- **Mood Analysis** - Analyzes text to determine emotional state
- **Daily Wellness Tips** - RAG-grounded, personalized advice generated fresh each day
- **Meme Generation** - Creates funny content from memory photos (multimodal LLM vision)
- **Voice Interaction** - Speech-to-text and AI voice responses
- **Long-Term Memory** - Conversations are embedded and stored per-user in a vector database, so
  the agent can recall relevant past context in later sessions

### 📊 Wellness Tools
- **Mood Tracking** - Visual mood history with insights
- **Breathing Exercises** - Interactive guided breathing sessions
- **Thought Interruption** - Tools to break overthinking patterns
- **Memory Management** - Photo storage with creative features
- **Progress Tracking** - Celebration of wellness activities

### 🎨 User Experience
- **Dark/Light Theme** - Eye-friendly interface options
- **Responsive Design** - Works perfectly on mobile and desktop
- **Voice Features** - Hands-free interaction capabilities
- **Real-time Updates** - Live mood recommendations and tips

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Framer Motion** for animations

### App Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Replit Auth** for authentication

### AI Backend (`ai-service/`)
- **Python** + **FastAPI** (fully async)
- **LangChain** — tool-calling agent, RAG chains, prompt orchestration
- **Chroma** vector database — RAG knowledge base + long-term conversational memory
- **Gemini 2.5 Flash** (default) or **OpenAI** — pluggable via one env var

## 📦 How to Package Your Complete App

### Option 1: Clone/Fork
1. Fork this Repo to your account
2. Connect to GitHub to create a repository
3. Clone to your local machine

### Option 2: Manual Copy
All files are already organized perfectly - just copy the entire project folder!

## 🔑 Environment Variables Needed

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret
AI_SERVICE_URL=http://localhost:8000
```

`ai-service/.env` additionally needs `GEMINI_API_KEY` (and optionally `OPENAI_API_KEY` /
`LLM_PROVIDER=openai`) — see [ai-service/README.md](ai-service/README.md).

## 🚀 Quick Start Commands

```bash
# 1. AI service (Python)
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload

# 2. App (Node) — in a separate terminal, from the repo root
npm install
npm run db:push
npm run dev

# Or run everything at once:
docker compose up --build
```

## 🎯 Your App is Complete!

This is a fully functional, production-ready mental wellness platform with:
- ✅ User authentication
- ✅ Real-time AI chat
- ✅ Mood tracking and analytics
- ✅ Interactive wellness tools
- ✅ Memory photo management
- ✅ Voice interaction
- ✅ Dark mode support
- ✅ Mobile-responsive design
- ✅ Database persistence

Everything is organized, documented, and ready to deploy or continue developing!
