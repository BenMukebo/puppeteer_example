import { useState } from 'react';
import { useInvoice } from './hooks/useInvoice.js';
import LineItems from './components/LineItems.jsx';
import InvoicePreview from './components/InvoicePreview.jsx';

const CURRENCIES = ['USD', 'EUR', 'GBP'];

export default function App() {
  const { invoice, update, addItem, removeItem, updateItem, totals, download, loading, error } = useInvoice();
  const [tab, setTab] = useState('form'); // 'form' | 'preview'

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header style={{ background: '#4F46E5', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
          Invoice Generator
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <DownloadBtn label="Download PDF" loading={loading.pdf} onClick={() => download('pdf')} primary />
          <DownloadBtn label="Download CSV" loading={loading.csv} onClick={() => download('csv')} />
        </div>
      </header>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 32px', fontSize: 13, borderBottom: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Tab toggle (mobile) */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#fff', padding: '0 32px' }}>
        {['form', 'preview'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 13,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: `3px solid ${tab === t ? '#4F46E5' : 'transparent'}`,
              color: tab === t ? '#4F46E5' : '#6B7280',
              marginBottom: -2,
              textTransform: 'capitalize',
            }}
          >
            {t === 'form' ? 'Edit Invoice' : 'Preview'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Form panel */}
        <div style={{ flex: 1, minWidth: 0, display: tab === 'preview' ? 'none' : undefined }} className="form-panel">
          <Section title="Invoice Details">
            <Row>
              <Field label="Invoice Number">
                <input style={inp} value={invoice.invoiceNumber} onChange={(e) => update('invoiceNumber', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select style={inp} value={invoice.currency} onChange={(e) => update('currency', e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Invoice Date">
                <input style={inp} type="date" value={invoice.invoiceDate} onChange={(e) => update('invoiceDate', e.target.value)} />
              </Field>
              <Field label="Due Date">
                <input style={inp} type="date" value={invoice.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
              </Field>
            </Row>
          </Section>

          <Section title="From (Seller)">
            <Field label="Company Name">
              <input style={inp} value={invoice.seller.company} onChange={(e) => update('seller.company', e.target.value)} placeholder="Acme Inc." />
            </Field>
            <Field label="Address">
              <input style={inp} value={invoice.seller.address} onChange={(e) => update('seller.address', e.target.value)} placeholder="123 Main St, City, Country" />
            </Field>
            <Row>
              <Field label="Email">
                <input style={inp} type="email" value={invoice.seller.email} onChange={(e) => update('seller.email', e.target.value)} placeholder="hello@acme.com" />
              </Field>
              <Field label="Phone">
                <input style={inp} value={invoice.seller.phone} onChange={(e) => update('seller.phone', e.target.value)} placeholder="+1 234 567 890" />
              </Field>
            </Row>
          </Section>

          <Section title="Bill To (Client)">
            <Row>
              <Field label="Client Name">
                <input style={inp} value={invoice.client.name} onChange={(e) => update('client.name', e.target.value)} placeholder="Jane Smith" />
              </Field>
              <Field label="Company">
                <input style={inp} value={invoice.client.company} onChange={(e) => update('client.company', e.target.value)} placeholder="Client Corp" />
              </Field>
            </Row>
            <Field label="Address">
              <input style={inp} value={invoice.client.address} onChange={(e) => update('client.address', e.target.value)} placeholder="456 Oak Ave, City, Country" />
            </Field>
            <Field label="Email">
              <input style={inp} type="email" value={invoice.client.email} onChange={(e) => update('client.email', e.target.value)} placeholder="jane@clientcorp.com" />
            </Field>
          </Section>

          <Section title="Line Items">
            <LineItems items={invoice.items} updateItem={updateItem} addItem={addItem} removeItem={removeItem} />
          </Section>

          <Section title="Adjustments">
            <Row>
              <Field label="Discount (%)">
                <input style={inp} type="number" min="0" max="100" value={invoice.discount} onChange={(e) => update('discount', Number(e.target.value))} />
              </Field>
              <Field label="Tax Rate (%)">
                <input style={inp} type="number" min="0" max="100" value={invoice.taxRate} onChange={(e) => update('taxRate', Number(e.target.value))} />
              </Field>
            </Row>
          </Section>

          <Section title="Notes & Terms">
            <Field label="Notes">
              <textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={invoice.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Any additional information..." />
            </Field>
            <Field label="Terms & Conditions">
              <textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={invoice.terms} onChange={(e) => update('terms', e.target.value)} />
            </Field>
          </Section>
        </div>

        {/* Preview panel */}
        <div style={{ flex: 1.1, minWidth: 0, position: 'sticky', top: 24, display: tab === 'form' ? undefined : undefined }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>Live Preview</span>
          </div>
          <InvoicePreview invoice={invoice} totals={totals} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .form-panel { display: ${tab === 'form' ? 'block' : 'none'} !important; }
        }
        input, select, textarea { transition: border-color .15s; }
        input:focus, select:focus, textarea:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); outline: none; }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14 }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</label>
      {children}
    </div>
  );
}

function DownloadBtn({ label, loading, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 18px',
        background: primary ? '#fff' : 'rgba(255,255,255,0.15)',
        color: primary ? '#4F46E5' : '#fff',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.4)',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 13,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'opacity .15s',
      }}
    >
      {loading ? 'Generating…' : label}
    </button>
  );
}

const inp = {
  width: '100%',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#111827',
  background: '#FAFAFA',
};
