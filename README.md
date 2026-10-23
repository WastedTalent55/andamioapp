# Andamio

**Full-stack web app for independent service professionals: manage customers, site evaluations and quotes, and turn accepted quotes into tracked projects.**

Andamio started from a real problem: remodeling and service quotes were handled through chat conversations and scattered notes, which made it hard to keep track of customers, estimates and their status. Andamio turns that process into one structured, tablet-friendly application.

> **Status:** Active development
> **Phase 1, quote workflow:** ✅ Complete
> **Phase 2, accepted projects and finances:** 🚧 In progress (project foundation in place, finances next)
> **Stack:** Angular 17 · Node.js / Express 5 · MySQL

---

## The Workflow

```text
Customer → Evaluation → Quote → (Accepted) → Project
```

Everything a professional generates at each stage lives in one place, without depending on separate documents, messages or spreadsheets. The interface is designed primarily for tablet use (on-site visits) and is responsive on desktop and mobile.

---

## Phase 1: Quote Workflow ✅

**Goal:** take a professional from customer information to a finished quote that can be previewed, edited, exported to PDF, sent to the customer and tracked by status.

**Customers**
* Create, edit and delete customers with contact information
* Structured addresses with Google Maps address autocomplete

**Evaluations**
* Record observations and requirements from on-site appointments
* Track evaluation status (pending, completed, cancelled)
* Create a quote directly from an evaluation, or create a direct quote without one

**Quotes**
* Labor and material line items with quantities and unit prices; subtotals and totals calculated automatically
* Per-company sequential quote numbers (folio)
* Evaluation-fee discount and 50% down payment calculated on the quote
* **Edit quotes with version history:** a draft is edited in place; once a quote has been sent, accepted or rejected, editing creates a new version and keeps the previous ones
* **Preview** before delivery
* **PDF generation and download**, branded with the company's logo, logo shape and brand color (generated in the browser with jsPDF)
* **Send to the customer:** opens WhatsApp in the customer's chat with a pre-loaded message (the PDF is downloaded first so it can be attached to the chat)
* **Status tracking:** Draft → Sent → Accepted / Rejected, updated from the quote preview

**Accounts and multi-tenancy**
* Google sign-in with JWT-protected API
* Tenant-based data isolation enforced in the backend
* Per-company settings: company information, logo and brand color

---

## Phase 2: Accepted Projects and Finances 🚧

Phase 1 ends when a quote is accepted. Phase 2 covers what happens next: running the job and understanding how it performs.

**Already in place**
* Accepting a quote creates a project (name, start date, estimated end date, notes) and marks the quote as accepted in one step; each quote can have only one project
* Project list and project detail view (customer, quote total, dates, contact, notes)
* Project statuses: active, paused, finished, cancelled
* Board view that follows each job from evaluation to quote to project
* Dashboard with counters (customers, evaluations, quotes, projects) and a recent-activity feed

**Planned**
* **Project finances:** record money in (deposits, payments) and money out (materials, labor, other expenses) per project, with balance and profit against the quoted amount
* **Work tracking:** days worked and completed work per project
* **KPIs and reporting:** more precise metrics, for example acceptance rate, income vs. expenses and profitability per project
* **User experience:** workflow and navigation improvements based on real use, better PDF customization, quote history views
* **Production deployment improvements**

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Angular 17, TypeScript, standalone components, reactive forms, Angular Router, HTTP interceptors, jsPDF + jspdf-autotable, Google Maps JS API loader, Lucide icons, responsive CSS |
| Backend | Node.js, Express 5, REST API, JWT, Google OAuth (google-auth-library), mysql2, dotenv |
| Database | MySQL: tenants, users, customers, customer addresses, evaluations, quotes, quote items, projects |
| Tooling | Git, GitHub, VS Code, npm |

---

## Architecture

```text
┌─────────────────────────────┐
│        Angular Client       │
│  Components · Services      │
│  Router · Interceptors      │
└──────────────┬──────────────┘
               │ HTTP / REST + JWT
               ▼
┌─────────────────────────────┐
│       Node.js / Express     │
│  Routes → Controllers       │
│  → Services → Models        │
│  Auth middleware            │
└──────────────┬──────────────┘
               │ mysql2
               ▼
┌─────────────────────────────┐
│           MySQL             │
└─────────────────────────────┘
```

The backend is layered: **routes** declare endpoints, **controllers** handle HTTP, **services** hold business rules (for example quote versioning and project creation from a quote) and **models** run the SQL. The authenticated tenant, taken from the JWT, scopes every database query, so data isolation does not depend on frontend restrictions.

---

## Project Structure

```text
andamioapp/
├── andamio-client/          # Angular frontend
│   └── src/app/
│       ├── core/            # services, models
│       ├── features/        # auth, customers, evaluations, quotes,
│       │                    # projects, board, dashboard, tenant
│       ├── shared/          # layout, cards, UI components
│       └── interceptors/
└── andamio-server/          # Node.js / Express backend
    ├── app.js
    └── src/                 # config, routes, controllers,
                             # services, models, middleware
```

---

## Security

* JWT-protected API routes (auth middleware)
* Google sign-in; the backend verifies the Google token and issues its own JWT
* An HTTP interceptor attaches the JWT on the client; the current routes do not register route guards. Access control is enforced by the backend.
* Tenant-scoped database queries enforced on the backend
* Database credentials and the JWT secret kept in environment variables, never in the repository

### Technical debt: evaluation time zones

Evaluation Form keeps native date and time inputs and sends `scheduled_date` as
`YYYY-MM-DDTHH:mm`, without a time-zone offset. MySQL stores a `DATETIME`; the
connection does not configure a time-zone policy. Editing currently extracts the
date and time directly from the API string, while other views use Angular's date
formatting. Depending on the server and browser time zones, these interpretations
may differ. A separate task must define whether visits represent local job-site
time or an absolute instant, then review serialization and existing data. The
evaluation/customer UX changes deliberately do not change this behavior.

When editing an evaluation, the form stays disabled until customers and the
evaluation have loaded. A loading message explains the wait; leaving the screen
cancels frontend subscriptions, preventing late responses from updating it.
Cancelling an HTTP subscription does not undo a write already received by the server.

The evaluation's new-customer dialog reuses Customer Form with manual address
entry. It preserves the evaluation draft and only selects the customer after its
address has been retrieved. A failed retrieval can be retried without repeating
creation. An unconfirmed creation (network/server error or missing returned ID)
blocks resubmission in that dialog: check the customer list before creating again.
The existing API has no idempotency key, so the frontend cannot guarantee the
outcome of a request whose response was lost.

---

## Getting Started

### Requirements

* Node.js 20+
* npm
* MySQL
* Angular CLI

### Installation

```bash
git clone https://github.com/WastedTalent55/andamioapp.git
cd andamioapp
```

### Backend

Create a `.env` file in `andamio-server/`:

```env
PORT=3000
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

> Never commit `.env` files or production credentials to Git.

For local MySQL, `DB_PORT` defaults to `3306` and TLS remains off unless
`DB_SSL=true` is set. For the Render service connected to Aiven, configure
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from Aiven's
connection details. Add Aiven's CA certificate in Render as a secret file (for
example, `aiven-ca.pem`), then set `DB_SSL=true` and
`DB_SSL_CA_PATH=/etc/secrets/aiven-ca.pem`. The app verifies the certificate
chain and hostname; it refuses to start the MySQL pool if TLS is enabled but
the CA file is missing or invalid. Do not add the CA file or database
credentials to the repository. Render supplies `PORT` to the web service, and
the backend binds that numeric port on `0.0.0.0`.

```bash
cd andamio-server
npm install
npm start
```

The API runs at `http://localhost:3000`. It needs a MySQL database with the tables listed in the tech stack above.

### Frontend

In another terminal:

```bash
cd andamio-client
npm install
ng serve
```

The app will be available at `http://localhost:4200`. The API URL is set in `src/environments/`, and address autocomplete needs a Google Maps API key.

---

## Technical Challenges and Learning

* **Quote versioning:** drafts are edited in place, but sent or accepted quotes must stay intact, so editing them creates a new version and keeps a history.
* **Authentication and tenant isolation:** using JWTs and tenant identifiers so users only access their own organization's data.
* **Business rules across entities:** accepting a quote creates its project and updates the quote status together, and prevents duplicate projects.
* **PDF generation:** rendering line items, totals, down payment and company branding into a PDF in the browser.
* **Tablet-first design:** building the interface around real on-site use rather than only desktop.

---

## Why I Built It

I built Andamio to understand what it takes to create an application around a real business workflow, not just a CRUD exercise: from the real-world problem, to the data model, API, authentication, frontend workflow and business logic, to a product someone can actually use.

---

## Author

**Diego López**: self-taught software developer focused on full-stack web development.

* GitHub: [WastedTalent55](https://github.com/WastedTalent55)
* Portfolio: [wasted-talent](https://WastedTalent55.github.io/wasted-talent)

---

## License

Personal learning and portfolio project. All rights reserved unless a license file states otherwise.

## Quote special conditions

Quotes may contain optional plain-text `special_conditions` (at most 5,000 Unicode
code points). General conditions remain in `tenants.terms_conditions` and are never
changed by quote saves. See [migration 001](database/migrations/README.md) before
using the new backend against an existing database; no migration runs on startup.
Older quotes have NULL conditions and display no particular-conditions section.
POST omission means NULL; PUT omission preserves the source version's value;
null, empty or whitespace-only strings clear it. Invalid types or over-limit text
return HTTP 400 without truncation. Nonempty text retains its original line breaks.

Drafts are updated in place (including their existing version counter behavior).
Editing a sent/accepted/rejected quote creates a new row with independent conditions;
omitted conditions inherit from the source. The evaluation lookup still resolves
the current quote. General conditions continue to be read from the **current**
study profile even when regenerating an old version's PDF; historical snapshots
are not implemented. The fixed 50% advance and all existing calculations remain
unchanged by particular conditions. Preview/download/WhatsApp use the same preview
PDF generator; the unused legacy generator in Quote Form is not extended.

Backend checks: `cd andamio-server && npm test` (Node's built-in test runner;
unit tests mock MySQL, no credentials required). Integration tests require the
explicit isolated-test configuration documented in the test helper; they skip
unless enabled. Frontend checks use Angular/Karma and the production build:
`npm run build -- --base-href /andamioapp/`. Publishing and database changes in an
existing environment require a separate review.

### Atomic quote saves and remaining concurrency limits

Creation, draft replacement and version creation now use one mysql2 pooled
connection with beginTransaction/commit/rollback and release in finally. The source
quote is locked with a tenant-scoped FOR UPDATE before editing; all header/item and
vigency writes use that connection. Creation locks the tenant row before allocating
MAX(folio)+1, serializing concurrent folio allocations through this service. A failed
rollback discards the uncertain connection rather than returning it for reuse.

**Concurrent version edits:** source rows are locked with tenant-scoped `FOR UPDATE` and checked for `is_current` while holding the lock. If another request has already created a successor, the stale request rolls back and returns HTTP 409. This uses the existing schema and preserves earlier versions. It does not provide an idempotency guarantee.

Integration fault tests compare actual MySQL data before/after errors. Item NOT NULL and invalid integer errors are real database failures; the vigency failure is injected after the real UPDATE to verify rollback. Concurrent stale-source requests verify one 200, one 409 and a single current successor. See [backend test instructions](andamio-server/test/README.md).

The PDF retains standard Helvetica: Spanish accents/ñ and line breaks are tested;
emoji and arbitrary non-Latin glyphs need an embedded Unicode font and are not
claimed to render correctly. utf8mb4 storage and the form support those characters.
