export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const invoice = req.body;
  if (!invoice?.items?.length) {
    return res.status(400).json({ error: 'Invoice must have at least one item.' });
  }

  try {
    const csv = buildCSV(invoice);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber || '001'}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'CSV generation failed.', detail: err.message });
  }
}

function buildCSV(invoice) {
  const { invoiceNumber = '001', invoiceDate = '', dueDate = '', seller = {}, client = {}, items = [], taxRate = 0, discount = 0, currency = 'USD', notes = '' } = invoice;
  const sym = { USD: '$', EUR: '\u20AC', GBP: '\u00A3' }[currency] ?? `${currency} `;
  const fmt = (n) => Number(n).toFixed(2);

  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (taxRate / 100);
  const total = taxable + taxAmt;
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
