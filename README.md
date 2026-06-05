# AgentAudit 🛡️

### AI-powered Solidity smart contract security auditor — built with Google Gemini API

[![Live Demo](https://img.shields.io/badge/Live%20Demo-AgentAudit-blue?style=flat-square)](https://agentaudit.vercel.app)
[![Built with Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini%20API-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Python](https://img.shields.io/badge/Backend-Python%20FastAPI-3776AB?style=flat-square&logo=python)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## The problem

In 2024–2025, over **$2.3 billion** was lost to smart contract exploits. Small Web3 projects and indie developers cannot afford $10,000–$20,000 manual security audits. Vulnerabilities like reentrancy attacks, integer overflows, and ERC20 race conditions go undetected until it's too late.

**AgentAudit solves this.** Paste a Solidity contract or drop a GitHub URL — the AI agent scans it in seconds and returns a professional security report with severity-rated findings, line numbers, and actionable fix recommendations.

---

## Demo

![AgentAudit screenshot](docs/screenshot.png)

**Sample audit output on a real ERC20 contract:**

```
SimpleToken — Risk Score: 5/100
✔ 3 findings detected

HIGH   → Ether trapped via payable fallback (L355–357)
MEDIUM → ERC20 approve() front-running / race condition (L215–221)
LOW    → Insufficient zero address check syntax (L306, 319)
```

---

## Features

- **Paste or link** — supports raw Solidity code or GitHub blob/raw URLs
- **Multi-step agentic analysis** — Gemini agent checks for reentrancy, access control, overflow, MEV/front-running, gas griefing, logic errors, and more
- **Severity ratings** — Critical / High / Medium / Low / Info with line-level references
- **Fix recommendations** — each finding includes a concrete code-level fix
- **PDF export** — download a professional audit report for sharing or archiving
- **Risk score** — quantified 0–100 risk rating per contract

---

## Tech stack

| Layer | Technology |
|---|---|
| AI agent | Google Gemini API (via Google AI Studio) |
| Agentic orchestration | Google ADK / Antigravity |
| Backend | Python, FastAPI |
| Frontend | React.js |
| Deployment | Vercel (frontend) + Railway (backend) |
| PDF generation | ReportLab |

---

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google AI Studio API key → [get one free here](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/leelabhaskar22/agentaudit.git
cd agentaudit
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY to .env
uvicorn main:app --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the app is running.

---

## How the agent works

```
User input (Solidity code or GitHub URL)
        ↓
  [Agent Step 1] Fetch & parse contract source
        ↓
  [Agent Step 2] Gemini analyzes for vulnerability categories:
                 reentrancy · overflow · access control ·
                 front-running · gas griefing · logic errors
        ↓
  [Agent Step 3] Structured findings with severity + line refs
        ↓
  [Agent Step 4] Generate PDF audit report
        ↓
    Results rendered in UI + downloadable PDF
```

The agent uses a security-focused system prompt engineered for Solidity analysis. Each finding is independently verified against the contract's AST-level structure before being included in the report.

---

## Example findings detected

| Vulnerability | Severity | Description |
|---|---|---|
| Reentrancy | Critical | External call before state update — classic DAO exploit pattern |
| Payable fallback without withdraw | High | ETH permanently locked in contract |
| ERC20 approve() race condition | Medium | Front-running attack on allowance changes |
| Unchecked return values | Medium | Low-level call return values not validated |
| Integer overflow (pre-0.8) | High | SafeMath not used in older compiler versions |
| address(0) check syntax | Low | Literal 0 used instead of address(0) |

---

## Project structure

```
agentaudit/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── agent.py             # Gemini agentic audit logic
│   ├── pdf_report.py        # PDF generation
│   ├── prompts.py           # Security analysis prompts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # AuditForm, FindingCard, ReportView
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Roadmap

- [ ] Multi-file contract support
- [ ] Audit history and saved reports
- [ ] Slither / static analysis integration for cross-validation
- [ ] Support for Vyper contracts
- [ ] VS Code extension

---

## Built by

**Saladhula Leela Bhaskar** — React Native & AI developer based in Hyderabad, India.

[![GitHub](https://img.shields.io/badge/GitHub-leelabhaskar22-181717?style=flat-square&logo=github)](https://github.com/leelabhaskar22)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-leelabhaskar22-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/leelabhaskar22)

---

*AgentAudit is an AI-assisted tool and does not replace a professional security audit for production contracts.*
