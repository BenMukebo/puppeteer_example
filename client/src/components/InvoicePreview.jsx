// Renders the exact same visual as the PDF but in the browser using inline styles.
export default function InvoicePreview({ invoice, totals }) {
  const { invoiceNumber, invoiceDate, dueDate, currency, seller, client, items, taxRate, discount, notes, terms } = invoice;
  const { subtotal, discountAmt, taxAmt, total } = totals();
  const sym = { USD: '$', EUR: '€', GBP: '£' }[currency] ?? `${currency} `;
  const fmt = (n) => `${sym}${Number(n).toFixed(2)}`;

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{seller.company || 'Your Company'}</div>
          {seller.address && <div style={sub}>{seller.address}</div>}
          {seller.email && <div style={sub}>{seller.email}</div>}
          {seller.phone && <div style={sub}>{seller.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#4F46E5', letterSpacing: -1 }}>INVOICE</div>
          <div style={{ color: '#6B7280', fontSize: 13 }}># {invoiceNumber}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280', lineHeight: 1.8 }}>
            {invoiceDate && <div>Date: {invoiceDate}</div>}
            {dueDate && <div>Due: {dueDate}</div>}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 3, background: 'linear-gradient(to right,#4F46E5,#818CF8)', borderRadius: 2, marginBottom: 24 }} />

      {/* Bill To */}
      <div style={{ marginBottom: 24 }}>
        <div style={label}>Bill To</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{client.name || '—'}</div>
        {client.company && <div style={sub}>{client.company}</div>}
        {client.address && <div style={sub}>{client.address}</div>}
        {client.email && <div style={sub}>{client.email}</div>}
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
        <thead>
          <tr>
            {[['#', 'center', 30], ['Description', 'left', 'auto'], ['Qty', 'center', 50], ['Unit Price', 'right', 90], ['Amount', 'right', 90]].map(([h, align, w]) => (
              <th key={h} style={{ background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 10, padding: '8px 10px', textAlign: align, width: w }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F9FAFB' : '#fff' }}>
              <td style={{ ...ptd, textAlign: 'center', color: '#9CA3AF' }}>{idx + 1}</td>
              <td style={ptd}>{item.description || '—'}</td>
              <td style={{ ...ptd, textAlign: 'center' }}>{item.qty}</td>
              <td style={{ ...ptd, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
              <td style={{ ...ptd, textAlign: 'right', fontWeight: 600 }}>{fmt(Number(item.qty) * Number(item.unitPrice))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <table style={{ width: 240, borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={stda}>Subtotal</td>
              <td style={stdb}>{fmt(subtotal)}</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={{ ...stda, color: '#EF4444' }}>Discount ({discount}%)</td>
                <td style={{ ...stdb, color: '#EF4444' }}>-{fmt(discountAmt)}</td>
              </tr>
            )}
            {taxRate > 0 && (
              <tr>
                <td style={stda}>Tax ({taxRate}%)</td>
                <td style={stdb}>{fmt(taxAmt)}</td>
              </tr>
            )}
            <tr style={{ background: '#EEF2FF' }}>
              <td style={{ ...stda, fontWeight: 700, fontSize: 13, color: '#111827' }}>TOTAL DUE</td>
              <td style={{ ...stdb, fontWeight: 700, fontSize: 17, color: '#4F46E5' }}>{fmt(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes & Terms */}
      {(notes || terms) && (
        <div>
          {notes && (
            <div style={{ marginBottom: 14 }}>
              <div style={label}>Notes</div>
              <p style={{ ...sub, marginTop: 3 }}>{notes}</p>
            </div>
          )}
          {terms && (
            <div>
              <div style={label}>Terms & Conditions</div>
              <p style={{ ...sub, marginTop: 3 }}>{terms}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 36, paddingTop: 14, borderTop: '1px solid #E5E7EB', fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
        Thank you for your business.
      </div>
    </div>
  );
}

const wrap = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  padding: 40,
  fontFamily: "'Inter', system-ui, sans-serif",
  color: '#374151',
};
const sub = { fontSize: 11, color: '#6B7280', lineHeight: 1.6 };
const label = { fontSize: 9, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 };
const ptd = { padding: '8px 10px', borderBottom: '1px solid #E5E7EB', fontSize: 12 };
const stda = { padding: '6px 8px', color: '#6B7280', borderBottom: '1px solid #E5E7EB' };
const stdb = { padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #E5E7EB' };
