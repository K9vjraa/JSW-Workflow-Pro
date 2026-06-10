# JSW WorkFlow Pro - Enterprise Architecture Document

## 1. System Architecture

JSW WorkFlow Pro uses a modern, decoupled full-stack architecture that blends the rapid development capabilities of a React Single-Page Application (SPA) with a robust Node.js backend and a scalable Database-as-a-Service (Supabase/PostgreSQL).

**Key Components:**
- **Client Tier:** React 19 SPA served via CDN/Static Server, mobile-responsive and PWA capable.
- **API Tier:** Node.js + Express.js handling custom business logic, secure API proxies (Gemini), and Socket.IO for real-time signaling.
- **Data & Auth Tier:** Supabase providing Managed PostgreSQL, out-of-the-box JWT Authentication, Row-Level Security (RLS), and Blob Storage.

**High-Level Flow:**
1. Client authenticates directly with Supabase Auth -> Receives JWT.
2. Client queries Supabase directly for standard CRUD operations securely evaluated against RLS policies.
3. Client calls Express API (with JWT Bearer token) for complex operations: AI report generation via Gemini, custom analytics aggregation.
4. Express API coordinates with Gemini AI and broadcasts relevant state changes via Socket.IO.

## 2. Frontend Architecture

**Frameworks & Libraries:** React.js, React Router DOM, React Query (for data fetching and caching), Tailwind CSS v4, Lucide React (icons), Recharts (visualizations).

**Routing Strategy:**
Protected route wrappers ensure that only authenticated and authorized users access specific scopes:
- `ProtectedRoute` component validates JWT and role-level authorization.
- Role-based Layouts: Administrative, Employee, and Worker dashboards.

**State Management:**
- **Server State:** Handled by React Query (or direct Supabase queries with real-time subscriptions).
- **Client/UI State:** React Context (`AuthContext` for user session) and local hooks (`useState`, `useReducer`).

**Styling:** 
Tailwind CSS provides an explicit, scalable utility-first design system. Custom enterprise themes ("Immersive UI") are enforced globally via `index.css` root variables.

## 3. Backend Architecture

**Framework:** Node.js with Express.js (TypeScript)

**Responsibilities:**
- **AI Proxy:** Securely isolates the Google Gemini API key. Handles chunking, prompt engineering, and response formatting for user requests.
- **Real-time Server:** Maintains Socket.IO rooms partitioned by department and task IDs for chat, task updates, and push notifications.
- **Custom Business Logic:** Webhooks, cron jobs for automated daily reports, or complex queries that exceed Supabase RLS ergonomics.
- **Middleware:** `requireAuth` middleware verifies Supabase JWTs before executing protected routes.

## 4. Database Architecture (Supabase PostgreSQL)

Relational schema enforcing strict data integrity via Foreign Keys.

**Core Entities:**
- `users`: Managed alongside Supabase Auth (`auth.users`).
- `departments`: Organizational partitions.
- `tasks`: Core operational units.
- `reports`: Submissions linked to tasks.
- `messages`: Real-time chat logs.

**Security:**
- **Row-Level Security (RLS):** Policies ensure Workers only see assigned tasks, Employees see department metadata, and Admins see global scopes.
- **Transactions:** Complex assignments are handled via PostgreSQL functions/RPCs for ACID compliance.

## 5. Realtime Architecture

**Bidirectional Communication:**
- **Socket.IO:** Used for high-frequency, low-latency ephemeral chat messages and presence indicators within department and task rooms.
- **Supabase Realtime (Postgres CDC):** Used to sync persistent state changes across clients (e.g., when a task's status goes from `PENDING` to `COMPLETED`, UI lists re-render automatically).

## 6. Deployment Architecture

Container-native, CI/CD-driven deployment.

- **Frontend:** Compiled to static assets (`dist/`) and served natively by the Express server in production. Alternatively, can be decoupled to Vercel/Cloudflare Pages.
- **Backend/API:** Packaged as a Docker container. Deployable to Google Cloud Run, Render, or Railway. Binds to `0.0.0.0:3000` for ingress routing.
- **Database:** Supabase managed Cloud DB (AWS/GCP backed).

## 7. Folder Structure
```
/
├── dist/                # Production build output
├── src/                 # Frontend React Code
│   ├── components/      # Reusable UI components (Layout, ProtectedRoute)
│   ├── contexts/        # Global State (AuthContext)
│   ├── lib/             # Utility functions & SDK Init (supabase.ts, utils.ts)
│   ├── pages/           # Route-level views (Login, Dashboards, Tasks)
│   ├── App.tsx          # Main Router & Entry
│   ├── index.css        # Global Tailwind & Custom Theme Variables
│   └── main.tsx         # React DOM Render
├── supabase/            # Database Migrations & Schema
│   └── schema.sql       # PostgreSQL DDL and RLS Policies 
├── docs/                # Architecture & PRDs
├── server.ts            # Node/Express Entry Point & Socket.IO
├── package.json         # Dependencies & Build Scripts
└── tsconfig.json        # TypeScript configuration
```

## 8. Scalability Plan

**Phase 1: Vertical Scaling (Current)**
- Cloud Run automatically provisions CPU/Memory based on concurrency.
- Supabase connection pooling handles hundreds of concurrent DB connections.

**Phase 2: Horizontal Scaling & Caching**
- Distribute Node.js backend across multiple instances.
- Introduce Redis adapter for Socket.IO multi-node clustering.
- Implement CDN caching for static frontend assets and uploaded media (Supabase Storage edge caching).
- Implement database indexing on high-frequency query axes (`department_id`, `status`).

**Phase 3: High Availability**
- Supabase Read Replicas for heavy read operations (Analytics).
- Geo-distributed edge functions for AI proxies to reduce latency.
