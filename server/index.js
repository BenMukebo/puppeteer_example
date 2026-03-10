import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { buildInvoiceHTML } from './template.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── helpers ───────────────────────────────────────────────────────────────────

function calcTotals(items = [], discount = 0, taxRate = 0) {
  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (taxRate / 100);
  const total = taxable + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}

function currencySymbol(currency = 'USD') {
  return { USD: '$', EUR: '€', GBP: '£' }[currency] ?? `${currency} `;
}

function buildCSV(invoice) {
  const { invoiceNumber = '001', invoiceDate = '', dueDate = '', seller = {}, client = {}, items = [], taxRate = 0, discount = 0, currency = 'USD', notes = '' } = invoice;
  const sym = currencySymbol(currency);
  const fmt = (n) => Number(n).toFixed(2);
  const { subtotal, discountAmt, taxAmt, total } = calcTotals(items, discount, taxRate);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  return [
    ['Invoice Number', 'Invoice Date', 'Due Date', 'From', 'Client'].map(esc).join(','),
    [invoiceNumber, invoiceDate, dueDate, seller.company, client.name].map(esc).join(','),
    '',
    ['#', 'Description', 'Qty', 'Unit Price', 'Amount'].map(esc).join(','),
    ...items.map((item, idx) =>
      [idx + 1, item.description, item.qty, fmt(item.unitPrice), fmt(Number(item.qty) * Number(item.unitPrice))].map(esc).join(',')
    ),
    '',
    ['', '', '', 'Subtotal', `${sym}${fmt(subtotal)}`].map(esc).join(','),
    ...(discount > 0 ? [['', '', '', `Discount (${discount}%)`, `-${sym}${fmt(discountAmt)}`].map(esc).join(',')] : []),
    ...(taxRate > 0 ? [['', '', '', `Tax (${taxRate}%)`, `${sym}${fmt(taxAmt)}`].map(esc).join(',')] : []),
    ['', '', '', 'TOTAL', `${sym}${fmt(total)}`].map(esc).join(','),
    ...(notes ? ['', ['Notes', notes].map(esc).join(',')] : []),
  ].join('\n');
}

// ── routes ────────────────────────────────────────────────────────────────────

app.post('/api/invoice/pdf', async (req, res) => {
  const invoice = req.body;
  if (!invoice?.items?.length) {
    return res.status(400).json({ error: 'Invoice must have at least one item.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const html = buildInvoiceHTML(invoice);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || '001'}.pdf"`,
    });
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed.', detail: err.message });
  } finally {
    await browser?.close();
  }
});

app.post('/api/invoice/csv', (req, res) => {
  const invoice = req.body;
  if (!invoice?.items?.length) {
    return res.status(400).json({ error: 'Invoice must have at least one item.' });
  }

  try {
    const csv = buildCSV(invoice);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || '001'}.csv"`,
    });
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'CSV generation failed.', detail: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Invoice server → http://localhost:${PORT}`));
