export function buildInvoiceHTML(invoice) {
  const {
    invoiceNumber = '001',
    invoiceDate = '',
    dueDate = '',
    currency = 'USD',
    seller = {},
    client = {},
    items = [],
    taxRate = 0,
    discount = 0,
    notes = '',
    terms = '',
  } = invoice;

  const sym = { USD: '$', EUR: '€', GBP: '£' }[currency] ?? currency + ' ';
  const fmt = (n) => `${sym}${Number(n).toFixed(2)}`;

  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (taxRate / 100);
  const total = taxable + taxAmt;

  const itemRows = items
    .map(
      (item, idx) => `
    <tr class="${idx % 2 === 0 ? 'row-even' : ''}">
      <td class="center muted">${idx + 1}</td>
      <td>${item.description || '-'}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${fmt(item.unitPrice)}</td>
      <td class="right bold">${fmt(Number(item.qty) * Number(item.unitPrice))}</td>
    </tr>`
    )
    .join('');

  const summaryRows = `
    <tr>
      <td class="label">Subtotal</td>
      <td class="right">${fmt(subtotal)}</td>
    </tr>
    ${
      discount > 0
        ? `<tr>
      <td class="label" style="color:#EF4444">Discount (${discount}%)</td>
      <td class="right" style="color:#EF4444">-${fmt(discountAmt)}</td>
    </tr>`
        : ''
    }
    ${
      taxRate > 0
        ? `<tr>
      <td class="label">Tax (${taxRate}%)</td>
      <td class="right">${fmt(taxAmt)}</td>
    </tr>`
        : ''
    }
    <tr class="total-row">
      <td class="label">TOTAL DUE</td>
      <td class="right total-amount">${fmt(total)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      color: #374151;
      background: #fff;
      padding: 48px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .company-name { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .sub { font-size: 12px; color: #6B7280; line-height: 1.6; }
    .invoice-badge { text-align: right; }
    .invoice-title { font-size: 36px; font-weight: 800; color: #4F46E5; letter-spacing: -1px; }
    .invoice-num { font-size: 15px; color: #6B7280; margin-top: 2px; }
    .invoice-dates { margin-top: 8px; font-size: 12px; color: #6B7280; line-height: 1.8; }

    /* ── Divider ── */
    .divider {
      height: 3px;
      background: linear-gradient(to right, #4F46E5, #818CF8);
      border-radius: 2px;
      margin-bottom: 28px;
    }

    /* ── Bill To ── */
    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9CA3AF;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .client-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .bill-to { margin-bottom: 28px; }

    /* ── Items Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead th {
      background: #4F46E5;
      color: #fff;
      font-weight: 600;
      font-size: 11px;
      padding: 10px 12px;
      text-align: left;
    }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }

    tbody td {
      padding: 9px 12px;
      border-bottom: 1px solid #E5E7EB;
    }
    .row-even { background: #F9FAFB; }
    .center { text-align: center; }
    .right { text-align: right; }
    .muted { color: #9CA3AF; }
    .bold { font-weight: 600; }

    /* ── Summary ── */
    .summary-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .summary-table {
      width: 260px;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #E5E7EB;
    }
    .label { color: #6B7280; }
    .total-row { background: #EEF2FF; }
    .total-row td { font-weight: 700; font-size: 14px; border-bottom: none; color: #111827; }
    .total-amount { color: #4F46E5; font-size: 18px; }

    /* ── Notes / Terms ── */
    .extra { margin-top: 8px; }
    .extra-block { margin-bottom: 16px; }
    .extra-block p { font-size: 12px; color: #6B7280; line-height: 1.6; margin-top: 4px; }

    /* ── Footer ── */
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      font-size: 11px;
      color: #9CA3AF;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${seller.company || 'Your Company'}</div>
      ${seller.address ? `<div class="sub">${seller.address}</div>` : ''}
      ${seller.email ? `<div class="sub">${seller.email}</div>` : ''}
      ${seller.phone ? `<div class="sub">${seller.phone}</div>` : ''}
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num"># ${invoiceNumber}</div>
      <div class="invoice-dates">
        ${invoiceDate ? `<div>Date: ${invoiceDate}</div>` : ''}
        ${dueDate ? `<div>Due: ${dueDate}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Bill To -->
  <div class="bill-to">
    <div class="section-label">Bill To</div>
    <div class="client-name">${client.name || '-'}</div>
    ${client.company ? `<div class="sub">${client.company}</div>` : ''}
    ${client.address ? `<div class="sub">${client.address}</div>` : ''}
    ${client.email ? `<div class="sub">${client.email}</div>` : ''}
  </div>

  <!-- Items -->
  <table>
    <thead>
      <tr>
        <th style="width:36px" class="center">#</th>
        <th>Description</th>
        <th style="width:60px" class="center">Qty</th>
        <th style="width:110px" class="right">Unit Price</th>
        <th style="width:110px" class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Summary -->
  <div class="summary-wrap">
    <table class="summary-table">
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  <!-- Notes & Terms -->
  ${
    notes || terms
      ? `<div class="extra">
      ${notes ? `<div class="extra-block"><div class="section-label">Notes</div><p>${notes}</p></div>` : ''}
      ${terms ? `<div class="extra-block"><div class="section-label">Terms & Conditions</div><p>${terms}</p></div>` : ''}
    </div>`
      : ''
  }

  <div class="footer">Thank you for your business.</div>

</body>
</html>`;
}
