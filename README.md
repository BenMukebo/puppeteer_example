# Invoice Generator with Puppeteer PDF Export

A full-stack invoice application that demonstrates **Puppeteer's HTML-to-PDF rendering pipeline**. Users fill out an invoice form in the browser, preview it live, and export it as a pixel-perfect PDF — generated server-side by launching a headless Chromium instance with Puppeteer.

## Why Puppeteer for PDF Generation?

Most PDF libraries work at a low level — positioning text, drawing lines, managing fonts manually. Puppeteer takes a different approach: you build your document as a **standard HTML/CSS page**, then let a real browser engine (Chromium) render and print it to PDF. This gives you:

- **Full CSS support** — flexbox, gradients, Google Fonts, `@media print`, alternating row colors — anything Chrome can render, your PDF gets.
- **Pixel-perfect output** — the PDF looks identical to what you see in a browser, because it *is* rendered by a browser.
- **Familiar tooling** — no new DSL or layout engine to learn. If you can write HTML and CSS, you can build complex PDFs.

The trade-off is resource cost: each PDF request launches a full Chromium process, which uses ~50-100 MB of RAM. This project launches and closes a browser per request (`server/index.js`), which is simple but not suited for high-throughput production use. For that, you'd keep a persistent browser instance or use a pool.

## How the PDF Pipeline Works

The PDF generation flow lives entirely in the `server/` directory:

```
Client POST /api/invoice/pdf  (JSON invoice data)
        │
        ▼
  server/index.js
        │
        ├── 1. Validate: invoice must have at least one line item
        │
        ├── 2. Build HTML: calls buildInvoiceHTML(invoice) from template.js
        │      └── Injects invoice data into a self-contained HTML string
        │         with embedded CSS (Inter font, indigo theme, table layout)
        │
        ├── 3. Launch Puppeteer:
        │      puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
        │
        ├── 4. Render HTML in headless Chrome:
        │      page.setContent(html, { waitUntil: 'networkidle0' })
        │      └── networkidle0 waits for all resources (e.g. Google Fonts)
        │         to finish loading before proceeding
        │
        ├── 5. Generate PDF:
        │      page.pdf({ format: 'A4', printBackground: true, margin: 0 })
        │      └── printBackground: true ensures colored headers,
        │         alternating row stripes, and gradients appear in the PDF
        │
        ├── 6. Return binary PDF with Content-Disposition: attachment
        │
        └── 7. Close browser in finally block (cleanup even on error)
```

### Key Puppeteer Options Explained

```js
// server/index.js — PDF endpoint
const browser = await puppeteer.launch({
  headless: true,               // No visible browser window
  args: [
    '--no-sandbox',             // Required in Docker/CI environments
    '--disable-setuid-sandbox'  // Companion flag for containerized use
  ]
});

await page.setContent(html, {
  waitUntil: 'networkidle0'     // Wait until 0 network connections for 500ms
                                 // Critical: ensures Google Fonts are loaded
                                 // before the PDF is captured
});

const pdf = await page.pdf({
  format: 'A4',                 // Standard paper size (210 x 297 mm)
  printBackground: true,        // Without this, backgrounds are stripped
                                 // (Chrome's default print behavior)
  margin: { top: '0', right: '0', bottom: '0', left: '0' }
                                 // Zero margins — the HTML template handles
                                 // its own padding (48px body padding)
});
```

### The HTML Template (`server/template.js`)

The template is a single function `buildInvoiceHTML(invoice)` that returns a complete, self-contained HTML document. This is important for Puppeteer — the HTML must include everything inline because there's no server to resolve relative paths:

- **CSS is embedded** in a `<style>` tag (not a linked stylesheet)
- **Fonts are loaded** via a Google Fonts `@import` URL (this is why `networkidle0` matters)
- **No external images** — the template is pure HTML/CSS
- **Invoice data is interpolated** directly into the markup using template literals

The template produces a professional invoice layout with an indigo color scheme, a gradient divider, styled line-item table with alternating row colors, and a summary section with subtotal/discount/tax/total calculations.

## Project Structure

```
├── client/                  React 18 + Vite SPA (port 3000)
│   └── src/
│       ├── App.jsx              Invoice form with all input fields
│       ├── hooks/
│       │   └── useInvoice.js    State management, totals calc, download logic
│       └── components/
│           ├── InvoicePreview.jsx   Live preview (mirrors PDF template)
│           └── LineItems.jsx        Editable line-item rows
│
├── server/                  Express API (port 4000)
│   ├── index.js                 Routes: /api/invoice/pdf, /api/invoice/csv
│   └── template.js              HTML/CSS template for Puppeteer PDF rendering
│
└── package.json             Root convenience scripts
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Chromium** — Puppeteer downloads its own bundled Chromium during `npm install` in the `server/` directory. On Linux, you may need system libraries. Check the [Puppeteer troubleshooting guide](https://pptr.dev/troubleshooting) if the browser fails to launch.

### Install & Run

```bash
# Install dependencies for both packages
cd server && npm install    # Downloads Puppeteer + bundled Chromium (~170 MB)
cd ../client && npm install

# Terminal 1 — Start the API server (port 4000)
npm run server:start:dev

# Terminal 2 — Start the client dev server (port 3000)
npm run client:start:dev
```

Open [http://localhost:3000](http://localhost:3000), fill in the form, and click **Download PDF** to trigger the Puppeteer pipeline.

### How the Client Connects to the Server

The Vite dev server proxies all `/api` requests to `http://localhost:4000` (configured in `client/vite.config.js`). In production, you'd serve the built client static files from Express or put a reverse proxy in front.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/invoice/pdf` | Accepts invoice JSON, returns PDF binary via Puppeteer |
| `POST` | `/api/invoice/csv` | Accepts invoice JSON, returns CSV string |
| `GET`  | `/api/health` | Health check |

### Example: Generate a PDF with curl

```bash
curl -X POST http://localhost:4000/api/invoice/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-042",
    "invoiceDate": "2026-04-03",
    "dueDate": "2026-05-03",
    "currency": "USD",
    "seller": { "company": "Acme Inc.", "email": "billing@acme.com" },
    "client": { "name": "Jane Smith", "company": "Client Corp" },
    "items": [
      { "description": "Web Development", "qty": 40, "unitPrice": 150 },
      { "description": "UI Design", "qty": 20, "unitPrice": 120 }
    ],
    "taxRate": 10,
    "discount": 5,
    "notes": "Thank you for your business."
  }' --output invoice.pdf
```

## Extending the Puppeteer Setup

Some common modifications you might want to make:

- **Add headers/footers** — use `page.pdf({ displayHeaderFooter: true, headerTemplate: '...', footerTemplate: '...' })`. Note: header/footer templates have their own isolated CSS context.
- **Change page size** — swap `format: 'A4'` for `'Letter'`, `'Legal'`, or use `width`/`height` for custom dimensions.
- **Add page numbers** — combine `displayHeaderFooter` with the built-in CSS classes `pageNumber` and `totalPages` in footer templates.
- **Landscape orientation** — add `landscape: true` to the `page.pdf()` options.
- **Persistent browser** — instead of launching/closing per request, create the browser once at startup and reuse it via `browser.newPage()` for better performance.
- **Screenshot instead of PDF** — replace `page.pdf()` with `page.screenshot({ fullPage: true })` to get a PNG.

## Tech Stack

- **Puppeteer 22** — headless Chrome automation for PDF generation
- **Express** — API server with JSON body parsing
- **React 18** — client-side invoice form and live preview
- **Vite 5** — frontend dev server and build tool
