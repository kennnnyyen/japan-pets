# Tokyo Pet OS CRM Prototype

An interactive demonstration of the proposed Tokyo pet breeding and sales platform, covering buyer CRM, spending intent, animal pricing and litter records, responsible matching, deposits, revenue, handover controls and post-sale follow-up.

All people, animals and activity in the prototype are illustrative dummy data.
The animal portraits are original AI-generated demo assets and do not depict animals offered for sale.

## Prototype routes

- `/` — dual-entry landing page for customers and staff
- `/portal` — buyer and owner portal for pet discovery, interest registration and care requests
- `/crm` — admin CRM for sales, animal inventory, owners and service requests
- `/crm#reports` — ELT demo with sales, marketing and operations marts, expansion scenarios and a monthly CSV export

## Analytics demo

Register interest in an available animal in the owner portal, then open Data & Analytics in the same browser. Qualify the enquiry, book the viewing, record the in-person explanation and complete the handover. Refresh the warehouse to update the marts. The demo stores animal IDs and enquiry stages in the browser. Reporting fixtures, staffing assumptions and expansion scenarios are synthetic.

Run the analytics checks with `node --test tests/analytics-data.test.mjs`.

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
