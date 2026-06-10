# JSW WorkFlow Pro - Deployment Architecture

This document outlines the production deployment architecture for JSW WorkFlow Pro, utilizing Vercel for the frontend, Railway for the Node.js/Express backend, and Supabase for the database, authentication, and realtime services.

## Architecture Overview

*   **Frontend (SPA/PWA)**: Hosted on **Vercel** with global CDN caching.
*   **Backend (API Server)**: Node.js + Express hosted on **Railway** (scalable container).
*   **Database & Auth**: **Supabase** (PostgreSQL, Supabase Auth, Storage, Realtime).
*   **AI Services**: **Google Gemini API** (called exclusively by the backend).

---

## 1. Environment Variables Configuration

### Frontend (Vercel)
The following variables must be set in your Vercel Project Settings:
```env
# URL where the backend is hosted
VITE_API_URL=https://api.yourdomain.com

# Supabase Public Keys
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

### Backend (Railway)
The following variables must be set in your Railway Environment Variables:
```env
# Required for container routing
PORT=3000

# CORS settings
FRONTEND_URL=https://app.yourdomain.com

# Supabase Keys (Backend might need Service Role for admin tasks)
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# Google Gemini
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
```

---

## 2. CI/CD Pipeline (GitHub Actions equivalent)

### Frontend Deployment (Vercel)
Vercel integrates directly with GitHub.
1. Connect Vercel to the GitHub repository.
2. Framework Preset: **Vite**
3. Build Command: `npm run build:client` (Ensure you split build scripts in package.json if separating repo, or just `npm run build`).
4. Output Directory: `dist`
5. On every push to the `main` branch, Vercel automatically builds and deploys.

### Backend Deployment (Railway)
Railway also integrates directly with GitHub.
1. Connect Railway to the GitHub repository.
2. Build Command: `npm run build`
3. Start Command: `npm run start` (Starts the Express server from `dist/server.cjs`).
4. On every push to the `main` branch, Railway builds the container and deploys with zero downtime.

---

## 3. Production Readiness Checklist

### Backend & Infrastructure
- [ ] **Split Services**: If deploying independently, ensure the Frontend and Backend are decoupled correctly, adjusting CORS in Express:
  `app.use(cors({ origin: process.env.FRONTEND_URL }));`
- [ ] **Connection Pooling**: Use Supabase PgBouncer for serverless/high-density environments if doing direct SQL queries (though the current app uses Supabase client SDK so standard REST/WebSockets are fine).
- [ ] **Logging**: Set up structured logging in Railway. Avoid logging raw user PII.
- [ ] **Rate Limiting**: Add `express-rate-limit` to the backend to prevent API abuse, especially on the `/api/ai/*` endpoints.
- [ ] **PWA Configuration**: Verify Vite PWA settings (`manifest.webmanifest`, service worker) serve correctly over HTTPS.

### Frontend
- [ ] **Error Boundaries**: Implement React Error Boundaries to prevent full app crashes.
- [ ] **Asset Optimization**: Check that all images/SVG icons are compressed.
- [ ] **Analytics/Telemetry**: (Optional) Add frontend telemetry like Vercel Analytics or PostHog.
- [ ] **Performance Testing**: Run Lighthouse audit in Chrome DevTools to ensure PWA installability and high performance.

---

## 4. Security Checklist

- [ ] **API Keys**: Ensure `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are **never** prefixed with `VITE_` and are only available on the Railway backend.
- [ ] **CORS Settings**: Restrict Express CORS to accept requests *only* from the explicit Vercel frontend URL.
- [ ] **Supabase RLS**: Double-check `Row Level Security` policies in Supabase. Ensure NO table defaults to full public access. Example: Verify Users, Tasks, and Reports are strictly locked down by `department_id` and role.
- [ ] **Helmet**: Add `helmet` middleware in Express to secure HTTP headers.
- [ ] **Token Handling**: Ensure Supabase Auth tokens are secure. If moving to SSR later, switch to HttpOnly cookies. Currently, localStorage is handled securely by the Supabase SDK for SPAs.
- [ ] **Data Validation**: Ensure all inputs on endpoints like `/api/ai/report` and `/api/ai/task` are sanitized to prevent prompt injection.
