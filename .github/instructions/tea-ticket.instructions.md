---
description: "Use when: building features, writing backend logic, creating UI components, scanning QR codes, working with Google Sheets API, or any development task in the tea-ticket project. Covers architecture, tech stack, constraints, and conventions."
applyTo: "**"
---
# Tea-Ticket Project Instructions

## Architecture: Zero-Infrastructure SPA + Google Apps Script

This project follows a **minimalist "Zero-Infrastructure"** philosophy:

- **Frontend**: Single Page Application (Vite + Alpine.js + TypeScript + Tailwind CSS)
- **Backend**: Google Apps Script (GAS) deployed as a web app
- **Database**: Google Sheets (accessed via GAS)
- **Hosting**: GitHub Pages (static build output)
- **QR scanning**: `html5-qrcode` library

## Hard Rules

1. **No complex databases** — no PostgreSQL, MongoDB, SQLite. Only Google Sheets as the data layer, accessed through Google Apps Script.
2. **No heavy frameworks** — no Next.js, Nuxt, Angular. Use Vite + Alpine.js for the SPA.
3. **Google Apps Script compatibility** — all backend code must run in the GAS environment (no Node.js APIs, no `require`, no npm packages on the server side). GAS uses V8 runtime with ES2020 syntax.
4. **`status.md` tracking** — always maintain a `status.md` file in the project root to track progress, current state, and next steps. Update it after meaningful changes.
5. **QR scanning** — use the `html5-qrcode` library for all QR/barcode scanning features. Do not introduce alternative scanning libraries.

## Project Structure

```
tea-ticket/
├── src/                    # Frontend source (Vite + Alpine.js + TS)
│   ├── components/         # Alpine.js components
│   ├── services/           # API calls to GAS backend
│   ├── styles/             # Tailwind CSS entry
│   ├── types/              # TypeScript type definitions
│   └── main.ts             # App entry point
├── gas/                    # Google Apps Script backend
│   ├── Code.gs             # Main GAS entry (doGet/doPost)
│   ├── sheets.gs           # Google Sheets read/write helpers
│   └── utils.gs            # Shared utilities
├── public/                 # Static assets
├── status.md               # Progress tracking (always keep updated)
├── index.html              # SPA entry point
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Frontend Conventions

- Use **Alpine.js** (`x-data`, `x-bind`, `x-on`, etc.) for reactivity and state management
- Use **TypeScript** for all `.ts` files — define types in `src/types/`
- Use **Tailwind CSS** utility classes for styling — avoid custom CSS unless strictly necessary
- Wrap GAS API calls in `src/services/` with proper error handling and loading states
- Use `fetch()` to call the deployed GAS web app URL

```ts
// Example: calling GAS backend
const GAS_URL = import.meta.env.VITE_GAS_URL;

async function fetchData(action: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(GAS_URL);
  url.searchParams.set("action", action);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GAS error: ${res.status}`);
  return res.json();
}
```

## Google Apps Script Conventions

- Entry points: `doGet(e)` and `doPost(e)` for HTTP handling
- Return JSON via `ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)`
- Use `SpreadsheetApp.openById(SHEET_ID)` to access the database
- Add CORS headers via response: set `Access-Control-Allow-Origin` appropriately
- Keep `.gs` files focused: one file per concern (routes, sheets, utils)
- No npm packages, no `import`/`export` — GAS uses global scope across `.gs` files

```js
// Example: GAS doGet handler
function doGet(e) {
  const action = e.parameter.action;
  let result;

  switch (action) {
    case "getTickets":
      result = getTickets();
      break;
    default:
      result = { error: "Unknown action" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## QR Code Scanning

- Use `html5-qrcode` library (`Html5QrcodeScanner` or `Html5Qrcode`)
- Handle camera permission errors gracefully with user-friendly messages
- Always stop the scanner when the component is destroyed or hidden

## Deployment

- **Frontend**: build with `vite build`, deploy `dist/` to GitHub Pages
- **Backend**: use `clasp` CLI to push and deploy GAS code
  - `clasp push` to upload `.gs` files
  - `clasp deploy` to create a new deployment
  - Keep `.clasp.json` and `gas/.claspignore` in the repo
- GAS web app settings: Execute as → Me, Access → Anyone
- Store the GAS web app URL in `.env` as `VITE_GAS_URL`
