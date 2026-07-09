# 🎯 JobHunter Engine (High-End SaaS)

An automated, AI-powered job hunting and publishing system. Built with a premium Glassmorphism UI, a smart web scraper, and seamless Telegram Bot integration for instant job alerts.

![System Status](https://img.shields.io/badge/Status-Operational-emerald?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Scraper-339933?style=for-the-badge&logo=nodedotjs)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Premium Features

*   **💎 Glassmorphism Dashboard:** A highly interactive, meticulously designed frontend using Tailwind CSS and Framer Motion.
*   **🤖 Smart Scraper Engine:** Powered by Playwright, it aggressively extracts job data (including hidden Remote/Hybrid statuses and salaries) from LinkedIn and Indeed.
*   **🧠 AI-Powered Input:** Real-time typo correction, autocomplete, and tech-stack relational suggestions when adding search keywords.
*   **📱 Telegram Auto-Publisher:** Directly publishes approved opportunities to a Telegram channel with rich HTML formatting, inline apply buttons, and smart hashtags.
*   **📦 Bulk Operations & Virtual Bin:** Advanced state management to select multiple records, publish in sequence (to avoid rate limits), and auto-cleanup 7-day-old expired records.
*   **📥 CSV Export:** One-click data generation to download hunted jobs into spreadsheets.

## 🏗️ Architecture (Monorepo)

This repository contains two main services:
1.  `/job-hunter`: The Next.js Frontend App Router.
2.  `/scraper-backend`: The Node.js Express Server & Playwright Scraper.

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase)
Create a `opportunities` table in Supabase with the following schema:
\`\`\`sql
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
\`\`\`

### 2. Scraper Engine (Backend)
Navigate to the backend directory and set up the environment:
\`\`\`bash
cd scraper-backend
npm install
\`\`\`
Create a `.env` file in `/scraper-backend`:
\`\`\`env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_channel_id
\`\`\`
Start the engine:
\`\`\`bash
node index.js
\`\`\`

### 3. Glassmorphism Dashboard (Frontend)
Open a new terminal, navigate to the frontend directory:
\`\`\`bash
cd job-hunter
npm install
\`\`\`
Create a `.env.local` file in `/job-hunter`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
\`\`\`
Launch the dashboard:
\`\`\`bash
npm run dev
\`\`\`

## 🛠️ Tech Stack
*   **Frontend:** React, Next.js, Tailwind CSS, Framer Motion, Lucide React.
*   **Backend:** Node.js, Express, Playwright.
*   **BaaS:** Supabase (PostgreSQL).
*   **Integrations:** Telegram Bot API.

---
*Engineered for performance and productivity.*