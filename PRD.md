Product Requirements Document (PRD): Personal Finance Tracker Web App
1. Executive Summary
Problem Statement:
Pengguna mengalami ketergantungan tinggi pada paylater dan credit card untuk pembelian harian, yang menyebabkan pengeluaran berlebih dan kesulitan menabung. Tidak ada alat terintegrasi untuk melacak semua aspek keuangan pribadi, termasuk pengeluaran rutin, hutang, dan perencanaan investasi.

Proposed Solution:
Web app responsive untuk pencatatan keuangan pribadi yang mencakup tracking transaksi harian, budgeting, reminders pembayaran, dan dashboard analisis. App menggunakan React untuk frontend mobile-friendly, Django untuk backend, dan Supabase untuk database, memungkinkan pengguna mengelola balance pribadi vs. dinas, memantau limit kartu kredit/paylater, dan merencanakan tabungan/investasi.

Success Criteria:

Pengurangan pengeluaran harian sebesar 20% dalam 3 bulan pertama penggunaan.
Peningkatan tabungan bulanan sebesar 15% melalui tracking dan budgeting.
Mapping investasi yang akurat, dengan 90% pengguna melaporkan kemudahan dalam perencanaan jangka panjang.
User satisfaction score >= 4.5/5 berdasarkan survey setelah 1 bulan launch.
2. User Experience & Functionality
User Personas:

Persona Utama: Dani (Pengguna Aktif, 25-35 tahun, pekerja kantoran): Ingin mengurangi ketergantungan paylater, melacak pengeluaran harian (makan, transportasi, traktir), dan merencanakan tabungan/investasi. Menggunakan mobile untuk input cepat, desktop untuk analisis.
Persona Sekunder: Pengguna Keluarga: Orang tua/adik yang menerima jatah, atau pasangan yang ingin tracking traktir bersama.
User Stories:

As a user, I want to log daily expenses (food, apps, transport) so that I can track my spending habits.
As a user, I want to record online purchases with payment methods (paylater, bank, COD, credit card) so that I can monitor debt accumulation.
As a user, I want to set budgets for categories like coffee, food, and clothes so that I can compare actual vs. planned spending.
As a user, I want reminders for paylater/credit card payments so that I avoid late fees.
As a user, I want a dashboard showing my personal balance, savings goals, and investment mapping so that I can plan financially.
As a user, I want to track debts and receivables to others so that I manage interpersonal finances.
As a user, I want to log salary and office funds separately so that balances are distinct.
As a user, I want to record zakat obligations and family allowances so that I fulfill responsibilities.
As a user, I want to plan purchases (furniture, clothes) with priorities and targets so that I achieve goals.
As a user, I want alerts when salary usage reaches 80% so that I control spending.
Acceptance Criteria:

App must load on mobile browsers within 2 seconds.
All transaction logs must sync in real-time to Supabase.
Budget vs. actual comparison must show percentage variance.
Reminders must send notifications via email/SMS (integrate with external service).
Dashboard must display charts for spending trends and savings projections.
Data export to CSV/PDF for reports.
Multi-user support for family sharing (optional in MVP).
Non-Goals:

Native mobile apps (iOS/Android) – focus on responsive web.
Advanced AI predictions (e.g., auto-categorization via ML) – manual input only.
Integration with bank APIs for auto-import – manual entry.
Multi-currency support – focus on IDR only.
3. AI System Requirements
Tidak applicable – aplikasi ini tidak menggunakan AI.

4. Technical Specifications
Architecture Overview:

Frontend: React with Next.js for SSR, hosted on Vercel. Components: Login page, Transaction input form, Dashboard with charts (using Chart.js), Budget planner.
Backend: Django with DRF for REST APIs (e.g., /api/transactions, /api/budgets). Handles business logic like balance calculations and reminders. Hosted on Railway.
Database: Supabase (PostgreSQL) for user data, transactions, budgets. Real-time subscriptions for live updates.
Data Flow: User inputs via frontend → API calls to backend → Store in Supabase → Fetch for dashboard/reports.
Authentication: Supabase Auth for login/signup.
Integration Points:

Supabase: Database and auth.
Email/SMS service (e.g., SendGrid or Twilio) for reminders.
Optional: Google Calendar API for payment scheduling.
Security & Privacy:

Data encryption at rest (Supabase handles).
HTTPS everywhere.
User data isolated per account; no sharing without consent.
Compliance: Basic GDPR-like practices (data deletion on request).
Sensitive data (card limits) hashed; no storage of full card numbers.
5. Risks & Roadmap
Phased Rollout:

MVP (Month 1-2): Core features – transaction logging, basic dashboard, budget tracking. Launch to 10 beta users.
v1.1 (Month 3): Add reminders, debt tracking, family sharing.
v2.0 (Month 6): Advanced reporting, investment mapping, mobile PWA.
Technical Risks:

Learning curve for Django/React integration – mitigate with tutorials/docs.
Supabase rate limits on free tier – monitor and upgrade if needed.
Mobile performance on low-end devices – optimize with lazy loading.
Data loss if Supabase outage – implement backups.
Implementation Guidelines:

Use TDD for backend APIs.
Validate code with ESLint for React, flake8 for Python.
Deploy via CI/CD (GitHub Actions to Vercel/Railway).
Test on Chrome/Safari mobile emulators.
Iterate based on user feedback post-MVP.