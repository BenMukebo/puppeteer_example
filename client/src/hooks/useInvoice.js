import { useState, useCallback } from 'react';

const newItem = () => ({ id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0 });

const defaults = {
  invoiceNumber: '001',
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  currency: 'USD',
  seller: { company: '', address: '', email: '', phone: '' },
  client: { name: '', company: '', address: '', email: '' },
  items: [newItem()],
  taxRate: 0,
  discount: 0,
  notes: '',
  terms: 'Payment due within 30 days of invoice date.',
};

export function useInvoice() {
  const [invoice, setInvoice] = useState(defaults);
  const [loading, setLoading] = useState({ pdf: false, csv: false });
  const [error, setError] = useState('');

  // update any nested field via dot path, e.g. "seller.email"
  const update = useCallback((path, value) => {
    setInvoice((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const addItem = useCallback(() => setInvoice((p) => ({ ...p, items: [...p.items, newItem()] })), []);
  const removeItem = useCallback((id) => setInvoice((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) })), []);
  const updateItem = useCallback((id, field, value) => {
    setInvoice((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)) }));
  }, []);

  const totals = useCallback(() => {
    const subtotal = invoice.items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);
    const discountAmt = subtotal * ((invoice.discount || 0) / 100);
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * ((invoice.taxRate || 0) / 100);
    return { subtotal, discountAmt, taxAmt, total: taxable + taxAmt };
  }, [invoice.items, invoice.discount, invoice.taxRate]);

  const download = useCallback(async (type) => {
    setError('');
    setLoading((p) => ({ ...p, [type]: true }));
    try {
      const res = await fetch(`/api/invoice/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.${type === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  }, [invoice]);

  return { invoice, update, addItem, removeItem, updateItem, totals, download, loading, error };
}
