# DSR Manager

DSR Manager is an offline-first Progressive Web App for gas station owners and managers. It replaces manual daily sales registers with a searchable system for recording shift sales, managing parties and bills, tracking employees, and exporting reports.

## Features

- Record nozzle readings across three daily shifts
- Calculate sales quantities, amounts, cash, online payments, and credit totals
- Continue working offline using IndexedDB
- Sync local data to Supabase when a connection is available
- Install the application as a PWA on desktop or mobile
- Browse previous records through calendar and history views
- Manage credit parties and generate daily or party bills
- Track employee attendance, salary advances, and salary payments
- Configure station details, nozzles, and employees
- Export daily DSR data to Excel
- Export monthly summaries and bills to PDF or Excel
- Authenticate users and isolate cloud data with Supabase Row Level Security

## Tech Stack

- React 18 and React Router
- Vite 5
- Tailwind CSS
- Dexie.js / IndexedDB for offline storage
- Supabase for authentication and cloud sync
- SheetJS for Excel exports
- jsPDF for PDF exports
- Vite PWA and Workbox

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project if cloud authentication and sync are required

### Installation

```bash
git clone <repository-url>
cd dsr
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only use the public Supabase anonymous key in the frontend. Never add a service-role key to this file.

Start the development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Supabase Setup

1. Create a Supabase project.
2. Open the project's SQL Editor.
3. Run [`supabase_schema.sql`](./supabase_schema.sql) to create the database objects and security policies.
4. Add the project URL and anonymous key to `.env`.
5. Configure the required authentication providers and redirect URLs in Supabase.

If environment variables are not supplied, the application can also load Supabase credentials saved through its local settings.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## Production Build

```bash
npm run build
npm run preview
```

The repository includes [`vercel.json`](./vercel.json) for deployment to Vercel. Add both Supabase variables to the deployment platform before building.

## Offline and Sync Behavior

Operational data is stored locally in IndexedDB through Dexie, so saved records remain available without a network connection. When Supabase is configured and the device reconnects, the sync service uploads queued changes and refreshes cloud-backed data. The interface displays the current connectivity and sync state.

Because browser storage belongs to a particular browser profile and origin, configure cloud sync before relying on the app for production records or moving between devices.

## Project Structure

```text
src/
  components/    Reusable UI grouped by feature
  context/       Authentication, settings, shifts, and sync state
  db/            Dexie database and Supabase client
  hooks/         Online status, carryover, and shift hooks
  pages/         Route-level application screens
  services/      Business logic, persistence, sync, and exports
  utils/         Calculations, formatting, validation, and constants
files/           Product, technical, flow, and design documentation
public/          PWA icons and static assets
```

## Documentation

More detailed specifications are available in the [`files`](./files) directory:

- [`PRD.md`](./files/PRD.md) — product requirements
- [`TRD.md`](./files/TRD.md) — technical requirements
- [`APP_FLOW.md`](./files/APP_FLOW.md) — application flows
- [`BACKEND_SCHEMA.md`](./files/BACKEND_SCHEMA.md) — backend design
- [`UI_UX_BRIEF.md`](./files/UI_UX_BRIEF.md) — interface guidance

## Security Notes

- Keep `.env` files and private credentials out of version control.
- Use only the Supabase anonymous key in client-side code.
- Keep Row Level Security enabled on production tables.
- Review [`QA_SECURITY_REPORT.md`](./QA_SECURITY_REPORT.md) and [`PRODUCTION_READINESS_REPORT.md`](./PRODUCTION_READINESS_REPORT.md) before launch.

## License

No license has been specified for this project.
