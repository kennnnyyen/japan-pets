# Tokyo Pet OS CRM Prototype

An interactive demonstration of the proposed Tokyo pet breeding and sales platform, covering buyer CRM, spending intent, animal pricing and litter records, responsible matching, deposits, revenue, handover controls and post-sale follow-up.

All people, animals and activity in the prototype are illustrative dummy data.
The animal portraits are original AI-generated demo assets and do not depict animals offered for sale.

## Prototype routes

- `/` — dual-entry landing page for customers and staff
- `/portal` — buyer and owner portal for pet discovery, interest registration and care requests
- `/crm` — admin CRM for sales, animal inventory, owners and service requests

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production verification

```bash
npm run lint
npm run build
npm run start
```

## Vercel

Import the GitHub repository into Vercel. The repository uses the Next.js App Router and standard build scripts, so no custom framework or build configuration is required.

The UI source remains in `dist/` while the Next.js route renders it as the application shell. `scripts/prepare-assets.mjs` copies the tested stylesheet and browser interaction bundle into `public/` before development and production builds.
