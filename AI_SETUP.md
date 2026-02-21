# Luxaar AI Setup Guide

## 🧠 Overview

Luxaar AI is a **privacy-first, fully local AI tutor** powered by [Ollama](https://ollama.com). It runs entirely on your machine — no paid APIs, no data leaving your server.

### Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Luxaar Frontend │ ──► │  Express Proxy   │ ──► │   Ollama    │
│  (React/Next.js) │     │  (Port 3001)     │     │  (Port 11434)│
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Firestore│ (Chat memory)
                        └──────────┘
```

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **4GB+ RAM** (8GB recommended for llama3)
- **GPU** optional but improves speed significantly

---

## 🚀 Quick Start

### Step 1: Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com](https://ollama.com/download/windows)

### Step 2: Pull a Model

```bash
# Recommended (good balance of quality & speed)
ollama pull llama3

# Alternative options:
ollama pull mistral        # Fast, good for simple tasks
ollama pull llama3.1       # Latest LLaMA
ollama pull mixtral         # Mixture of experts, slower but powerful
ollama pull phi3            # Small & fast (Microsoft)
ollama pull gemma2          # Google's model
```

### Step 3: Start Ollama

```bash
ollama serve
```

Verify it's running:
```bash
curl http://localhost:11434/api/tags
```

### Step 4: Start the AI Proxy Server

```bash
cd server
npm install
npm start
```

You should see:
```
╔══════════════════════════════════════════╗
║   🧠 Luxaar AI Proxy Server             ║
║   Port: 3001                             ║
║   Ollama: http://localhost:11434         ║
╚══════════════════════════════════════════╝
✅ Ollama connected! Available models: llama3
```

### Step 5: Start Luxaar Frontend

```bash
# In the root luxaar directory
npm run dev
```

The AI chatbot button (purple, bottom-right) will appear on the learning page!

---

## 🎯 AI Modes

| Mode | Description | Best For |
|------|-------------|----------|
| 🎓 Tutor | Simple, friendly explanations | Understanding concepts |
| 📝 Notes | Bullet-point summaries | Quick revision |
| 🔬 Deep Dive | Detailed, thorough analysis | In-depth study |
| 📋 Exam Prep | Concise, exam-ready answers | Test preparation |
| 💻 Code Helper | Debug and explain code | Programming courses |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_AI_SERVER_URL=http://localhost:3001
```

### Proxy Server Environment

```bash
# Optional - set in server/.env or as env vars
AI_PORT=3001                          # Proxy server port
OLLAMA_URL=http://localhost:11434     # Ollama API URL
```

### Admin Settings

Navigate to **Dashboard → AI Settings** to:
- Enable/disable AI globally
- Choose default model
- Adjust temperature (creativity)
- Set max response tokens
- View usage statistics
- Clear all chat history

---

## 🔒 Security

1. **Ollama port is never exposed** — all requests go through the Express proxy
2. **CORS whitelisting** — only allowed frontend origins can make requests
3. **Auth-gated** — chatbot only renders for logged-in users
4. **Context restriction** — AI is instructed to only answer from course content
5. **No data leaves your server** — everything runs locally

---

## 🌐 Deployment Options

### Mode 1: Local Development
```
Laptop → Ollama + Proxy Server + Next.js (all on localhost)
```

### Mode 2: Self-Hosted (VPS)
```bash
# On your VPS:
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama serve &

# 2. Start proxy (use PM2 for persistence)
npm install -g pm2
cd server && pm2 start index.js --name luxaar-ai

# 3. Update CORS origins in server/index.js
# 4. Update NEXT_PUBLIC_AI_SERVER_URL to your VPS IP
```

### Mode 3: Dedicated GPU Server
```bash
# On GPU machine:
ollama serve

# On web server:
# Set OLLAMA_URL=http://<gpu-machine-ip>:11434
OLLAMA_URL=http://192.168.1.100:11434 node server/index.js
```

---

## 🗄️ Firestore Collections

The AI system uses these Firestore collections:

### `ai_chats`
```json
{
  "userId": "string",
  "courseId": "string", 
  "courseTitle": "string",
  "messages": [
    { "role": "user|assistant|system", "content": "string", "timestamp": "ISO" }
  ],
  "mode": "tutor|notes|deepdive|exam|code",
  "model": "llama3",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

### `ai_settings`
```json
{
  "enabled": true,
  "model": "llama3",
  "maxTokens": 1024,
  "temperature": 0.7,
  "enabledCourses": []
}
```

### Firestore Indexes Required
Add to `firestore.indexes.json`:
```json
{
  "collectionGroup": "ai_chats",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "courseId", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "AI Temporarily Unavailable" | Start Ollama: `ollama serve` |
| Proxy server won't start | Run `cd server && npm install` |
| Slow responses | Use a smaller model like `mistral` or `phi3` |
| Out of memory | Close other apps, or use a smaller model |
| CORS errors | Add your frontend URL to `ALLOWED_ORIGINS` in server/index.js |
| No models shown | Run `ollama pull llama3` first |

---

## 📊 Performance Tips

1. **Use GPU acceleration** — Ollama auto-detects NVIDIA/AMD GPUs
2. **Choose the right model**:
   - Fast: `phi3`, `mistral` (~2GB RAM)
   - Balanced: `llama3` (~4GB RAM)
   - Powerful: `mixtral`, `llama3.1:70b` (~32GB+ RAM)
3. **Limit max tokens** — 512-1024 is usually enough
4. **Lower temperature** — Faster, more focused responses

---

## 📁 File Structure

```
luxaar/
├── server/
│   ├── package.json          # Proxy server dependencies
│   └── index.js              # Express proxy server
├── src/
│   ├── lib/
│   │   └── ai/
│   │       └── aiService.ts  # AI service client
│   ├── components/
│   │   ├── ai/
│   │   │   └── AIChatbot.tsx # Main chatbot widget
│   │   └── admin/
│   │       └── AISettingsClient.tsx  # Admin settings
│   └── app/
│       └── dashboard/
│           └── admin/
│               └── ai-settings/
│                   └── page.tsx  # Admin route
└── AI_SETUP.md               # This file
```
