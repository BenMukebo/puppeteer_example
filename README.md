# Invoice Generator with Puppeteer PDF Export

A full-stack invoice generator that lets users create professional invoices in the browser and export them as **PDF** or **CSV**. The PDF generation is powered by **Puppeteer**, which renders a styled HTML template in a headless Chromium browser and converts it to a pixel-perfect PDF document.

## How Puppeteer PDF Generation Works

[Puppeteer](https://pptr.dev/) is a Node.js library that provides a high-level API to control a headless (or headful) Chromium browser. This project uses it specifically for **HTML-to-PDF conversion** — an approach that gives full control over the PDF layout using standard HTML and CSS.

### The PDF Pipeline

```
Client (React)                     Server (Express / Vercel Serverless)
┌────────────────┐                ┌──────────────────────────────────────────────┐
│ User fills out │   POST /api/   │  1. Receive invoice JSON                     │
│ invoice form   │──invoice/pdf──▶│  2. Inject data into HTML template           │
│                │                │  3. Launch headless Chromium via Puppeteer    │
│                │   PDF binary   │  4. Load HTML into a browser page             │
│ Download PDF   │◀──────────────│  5. Call page.pdf() to generate PDF buffer   │
└────────────────┘                │  6. Return PDF as binary response             │
                                  │  7. Close browser                             │
                                  └──────────────────────────────────────────────┘
```

### Key Puppeteer Code (`server/index.js`)

```javascript
import puppeteer from "puppeteer";

// Launch a headless Chromium instance
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();

// Load the invoice HTML (with all styles inlined)
await page.setContent(html, { waitUntil: "networkidle0" });

// Generate the PDF
const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

await browser.close();
```

### Why Puppeteer for PDFs?

| Approach                     | Pros                                                                                                      | Cons                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Puppeteer (this project)** | Pixel-perfect rendering, full CSS support (flexbox, gradients, fonts), same HTML works in browser preview | Requires Chromium binary (~400MB locally), heavier on resources |
| jsPDF / pdfkit               | Lightweight, no browser needed                                                                            | Manual coordinate-based layout, no CSS                          |
| wkhtmltopdf                  | Lighter than Chromium                                                                                     | Outdated WebKit engine, limited CSS support                     |

### Puppeteer Configuration Details

- **`headless: true`** — runs Chromium without a visible window (required for servers)
- **`--no-sandbox`** — needed in Docker/serverless environments where sandboxing isn't available
- **`waitUntil: 'networkidle0'`** — waits until no network requests for 500ms, ensuring fonts and assets are fully loaded before PDF capture
- **`printBackground: true`** — includes CSS background colors and gradients in the PDF (off by default in print mode)
- **`format: 'A4'`** — standard paper size; supports Letter, Legal, Tabloid, and custom dimensions

### The HTML Template (`server/template.js`)

The template uses **inline CSS** because Puppeteer renders the HTML in an isolated browser page with no external file access. All styles — including the Google Fonts import, table layouts, gradient dividers, and the indigo color scheme — are embedded directly in the HTML string returned by `buildInvoiceHTML()`.

The same visual design is mirrored in `client/src/components/InvoicePreview.jsx` for the live browser preview, using React inline styles instead of CSS classes.

## Project Structure

```
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── App.jsx          # Main form UI
│       ├── hooks/
│       │   └── useInvoice.js    # Invoice state management & API calls
│       └── components/
│           ├── InvoicePreview.jsx  # Live preview (mirrors PDF template)
│           └── LineItems.jsx      # Editable line items table
│
├── server/                  # Express backend (local dev)
│   ├── index.js             # API routes & Puppeteer PDF generation
│   └── template.js          # HTML/CSS invoice template
│
├── api/                     # Vercel serverless functions (production)
│   ├── invoice/
│   │   ├── pdf.js           # PDF endpoint (puppeteer-core + @sparticuz/chromium)
│   │   └── csv.js           # CSV endpoint
│   └── health.js            # Health check
│
└── vercel.json              # Vercel deployment configuration
```

## Local Development

### Prerequisites

- **Node.js** 18+
- Puppeteer will automatically download Chromium on `npm install` in the `server/` directory

### Setup

```bash
# Install dependencies for both client and server
cd client && npm install
cd ../server && npm install

# Start the server (port 4000)
npm run server:start:dev

# In another terminal, start the client (port 3000)
npm run client:dev
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so both run together seamlessly.

### Available Scripts (from root)

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `npm run client:dev`       | Start Vite dev server on port 3000                |
| `npm run client:build`     | Build client for production                       |
| `npm run server:start`     | Start Express server                              |
| `npm run server:start:dev` | Start Express server with `--watch` (auto-reload) |

## Deploying to Vercel

### Why the Deployment Setup Differs from Local

Locally, the server uses the full `puppeteer` package which bundles Chromium (~400MB). Vercel serverless functions have a **50MB size limit**, so the deployment uses:

- **`puppeteer-core`** — Puppeteer without the bundled Chromium
- **`@sparticuz/chromium`** — A stripped-down Chromium binary (~50MB) specifically built for AWS Lambda / Vercel serverless environments

The Express server (`server/index.js`) is **not deployed** to Vercel. Instead, the `api/` directory contains equivalent serverless functions that Vercel auto-deploys as API routes.

### Deployment Steps

1. **Install the Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Link and deploy**:

   ```bash
   vercel
   ```

   Vercel will auto-detect the configuration from `vercel.json`:
   - Builds the client from `client/` using Vite
   - Deploys `api/` functions as serverless endpoints
   - Routes `/api/*` to serverless functions, everything else to the SPA

3. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "functions": {
    "api/invoice/pdf.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

- **Memory: 1024MB** — Chromium needs significant memory to render pages
- **Max duration: 30s** — PDF generation with Puppeteer typically takes 3-8 seconds, but the limit accounts for cold starts where Chromium must be loaded into memory

### Important Vercel Considerations

- **Cold starts**: The first PDF request after a period of inactivity takes longer (~5-10s) because the serverless function must load the Chromium binary. Subsequent requests reuse the warm function instance.
- **Vercel plan limits**: The free (Hobby) plan allows 10s max function duration and 1024MB memory. The PDF function is configured to work within these limits, but complex invoices near the timeout may need a Pro plan (max 60s).
- **Font loading**: The HTML template imports Google Fonts via a `@import` URL. The `waitUntil: 'networkidle0'` setting ensures fonts are loaded before PDF generation, but this adds ~1-2s to each request.

## API Endpoints

### `POST /api/invoice/pdf`

Generates a PDF from invoice data.

**Request body** (JSON):

```json
{
  "invoiceNumber": "001",
  "invoiceDate": "2025-01-15",
  "dueDate": "2025-02-15",
  "currency": "USD",
  "seller": {
    "company": "Acme Inc.",
    "address": "123 Main St",
    "email": "hello@acme.com",
    "phone": "+1 234 567 890"
  },
  "client": {
    "name": "Jane Smith",
    "company": "Client Corp",
    "address": "456 Oak Ave",
    "email": "jane@client.com"
  },
  "items": [{ "description": "Web Development", "qty": 40, "unitPrice": 150 }],
  "taxRate": 10,
  "discount": 5,
  "notes": "Thank you for your business",
  "terms": "Payment due within 30 days"
}
```

**Response**: PDF binary (`application/pdf`)

### `POST /api/invoice/csv`

Same request body, returns a CSV file (`text/csv`).

### `GET /api/health`

Returns `{ "status": "ok" }`.

## Supported Currencies

USD ($), EUR (€), GBP (£)

## License

UNLICENSED — Private project.
