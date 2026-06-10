# JSW WorkFlow Pro - Documentation

## 1. Product Requirement Document (PRD)

**Project Name:** JSW WorkFlow Pro
**Purpose:** An enterprise-grade task management, reporting, communication, and approval platform tailored for manufacturing organizations like JSW Steel. Inspired by Microsoft To Do, Teams, and Jira.

### Core Features
- Role-based Access Control (Admin, Employee/Supervisor, Worker)
- Microsoft To Do style Task System (My Day, Important, Planned, Assigned)
- Multimedia Reporting Workflow (Text, Image, Video, Voice Notes, Geo-location)
- Realtime Discussion & Notifications (Department chat, Task-specific chat)
- AI Supercharged Capabilities (Auto-generated issue reports, checklists via Gemini)

## 2. Technical Requirement Document (TRD)

### Stack
- Frontend: React 19, Vite, Tailwind CSS V4, React Router, Recharts, Lucide Icons.
- Backend: Express JS + WebSocket (Socket.io).
- AI: Google Gemini `@google/genai` (Server-side API calls).
- Database / Persistence: Supabase PostgreSQL, Supabase Storage, and Auth.
- Deployment: Compatible with Google Cloud Run (Full-Stack Express + Vite container).

## 3. Database Schema
A complete PostgreSQL schema containing `users`, `departments`, `tasks`, `reports`, `attachments`, `messages`, and `notifications` has been provided in the `/supabase/schema.sql` file.

## 4. Components & Layout
- A single-screen dashboard layout with a left sidebar for categories and departments.
- A main content area for data tables and task interactions.
- A robust, mobile-first design leveraging Tailwind's utility classes.

## 5. API Endpoints
Provided via Express in `server.ts`:
- `GET /api/health` - Health check
- `POST /api/ai/report` - Generate professional industrial reports from messy worker notes.
- `POST /api/ai/task` - Autogenerate task checklists based on a machine issue.
- WebSockets (`socket.io`) handles real-time messages using `join_room`, `send_message`, and `task_update` events.

## 6. MVP Roadmap & Phase 2
- Phase 1 (MVP): React Dashboard, Mock/Supabase Data Store, Realtime Chat via JS Sockets, Gemini Insights via Server proxy.
- Phase 2: WebRTC Web audio and video calls, full offline PWA service workers.
