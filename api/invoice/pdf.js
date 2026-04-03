import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { buildInvoiceHTML } from '../../server/template.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const invoice = req.body;
  if (!invoice?.items?.length) {
    return res.status(400).json({ error: 'Invoice must have at least one item.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const html = buildInvoiceHTML(invoice);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber || '001'}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed.', detail: err.message });
  } finally {
    await browser?.close();
  }
}
