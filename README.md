<div align="center">

# 💼 JobHunter Engine

### *A Premium AI-Powered Job Hunting & Publishing Platform*

Automate job discovery, enrich listings with AI, manage opportunities from a luxury dashboard, and publish directly to Telegram — all from one powerful platform.

<br>

![Status](https://img.shields.io/badge/Status-Operational-22C55E?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0-6366F1?style=for-the-badge)
![License](https://img.shields.io/badge/License-Private-0F172A?style=for-the-badge)

<br>

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
![Playwright](https://img.shields.io/badge/Playwright-Scraper-2EAD33?style=flat-square&logo=playwright)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=flat-square&logo=telegram)

</div>

---

# ✨ Overview

**JobHunter Engine** is a complete AI-powered SaaS platform that automates the entire recruitment sourcing workflow.

From scraping premium job boards to publishing beautifully formatted opportunities on Telegram, every step is designed for speed, automation, and a premium user experience.

---

# 🚀 Core Features

## 💎 Premium Dashboard

- Elegant Glassmorphism interface
- Modern responsive UI
- Smooth Framer Motion animations
- Lightning-fast workflow
- Advanced filtering & searching

---

## 🤖 Intelligent Scraper Engine

Powered by **Playwright**, the scraper automatically extracts opportunities from major job platforms including:

- LinkedIn
- Indeed

Collected data includes:

- Job title
- Company
- Location
- Remote / Hybrid / On-site detection
- Salary information
- Source
- Apply URL

---

## 🧠 AI-Powered Search Assistant

Make keyword management effortless.

Features include:

- Smart typo correction
- Autocomplete suggestions
- Related technologies
- Tech stack recommendations
- Intelligent keyword relationships

---

## 📢 Telegram Auto Publisher

Publish approved opportunities directly to Telegram.

Supports:

- Rich HTML formatting
- Inline Apply buttons
- Smart hashtags
- Automatic formatting
- Queue publishing
- Rate-limit protection

---

## 📦 Smart Job Management

Manage thousands of opportunities effortlessly.

Features include:

- Multi-selection
- Bulk publish
- Bulk delete
- Virtual recycle bin
- Automatic cleanup
- Status management

---

## 📊 Export System

Export collected opportunities instantly.

- CSV generation
- Spreadsheet compatible
- One-click download

---

# 🏗 Project Architecture

```text
JobHunter-Engine
│
├── job-hunter/
│   ├── Next.js Frontend
│   ├── Glassmorphism Dashboard
│   └── AI User Interface
│
└── scraper-backend/
    ├── Express API
    ├── Playwright Scraper
    ├── Telegram Publisher
    └── Background Services
```

---

# ⚡ Tech Stack

| Layer | Technologies |
|--------|--------------|
| **Frontend** | Next.js • React • Tailwind CSS • Framer Motion • Lucide React |
| **Backend** | Node.js • Express |
| **Automation** | Playwright |
| **Database** | Supabase (PostgreSQL) |
| **Messaging** | Telegram Bot API |
| **Language** | TypeScript • JavaScript |

---

# 🚀 Getting Started

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/egokam/JobHunter.git

cd JobHunter
```

---

## 2️⃣ Database Setup

Create the following table inside your Supabase project.

```sql
CREATE TABLE opportunities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    url TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    source TEXT,
    work_type TEXT,
    salary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🖥 Backend Setup

Navigate to the scraper service.

```bash
cd scraper-backend
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
PORT=5000

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_channel_id
```

Start the backend.

```bash
node index.js
```

---

# 🎨 Frontend Setup

Navigate to the dashboard.

```bash
cd job-hunter
```

Install packages.

```bash
npm install
```

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Launch the application.

```bash
npm run dev
```

---

# 📂 Environment Variables

## Backend

| Variable | Description |
|----------|-------------|
| PORT | Express server port |
| SUPABASE_URL | Supabase Project URL |
| SUPABASE_ANON_KEY | Supabase API Key |
| TELEGRAM_BOT_TOKEN | Telegram Bot Token |
| TELEGRAM_CHAT_ID | Telegram Channel ID |

---

## Frontend

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Public Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public Supabase Key |

---

# 🌟 Highlights

- ⚡ High-performance architecture
- 🤖 Fully automated scraping
- 💎 Luxury Glassmorphism interface
- 📱 Telegram publishing automation
- 🧠 AI-assisted keyword generation
- 📊 CSV export support
- 🔥 Bulk operations
- ♻ Virtual recycle bin
- 🚀 Modern SaaS architecture

---

# 📈 Workflow

```text
Keywords
     │
     ▼
AI Suggestions
     │
     ▼
Playwright Scraper
     │
     ▼
Supabase Database
     │
     ▼
Dashboard Review
     │
     ▼
Approve Jobs
     │
     ▼
Telegram Publisher
```

---

<div align="center">

## ⚡ Built for Speed • Designed for Scale • Engineered for Productivity

*A premium automation platform for modern job sourcing.*

</div>