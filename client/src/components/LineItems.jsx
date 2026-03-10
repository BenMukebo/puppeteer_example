export default function LineItems({ items, updateItem, addItem, removeItem }) {
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {[['#', 36], ['Description', '40%'], ['Qty', 70], ['Unit Price', 110], ['Amount', 100], ['', 36]].map(([h, w]) => (
                <th
                  key={h}
                  style={{
                    width: w,
                    background: '#4F46E5',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 11,
                    padding: '9px 10px',
                    textAlign: ['Qty', '#', ''].includes(h) ? 'center' : ['Unit Price', 'Amount'].includes(h) ? 'right' : 'left',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                <td style={td} align="center"><span style={{ color: '#9CA3AF' }}>{idx + 1}</span></td>
                <td style={td}>
                  <input
                    style={inp}
                    value={item.description}
                    placeholder="Item description"
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </td>
                <td style={td}>
                  <input
                    style={{ ...inp, textAlign: 'center', width: 60 }}
                    type="number"
                    min="0"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                  />
                </td>
                <td style={td}>
                  <input
                    style={{ ...inp, textAlign: 'right' }}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                  />
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                  {(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 20, lineHeight: 1, opacity: items.length === 1 ? 0.3 : 1 }}
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addItem}
        style={{ marginTop: 10, padding: '7px 18px', background: '#EEF2FF', color: '#4F46E5', border: '1px dashed #A5B4FC', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
      >
        + Add Item
      </button>
    </div>
  );
}

const td = { padding: '7px 10px', borderBottom: '1px solid #E5E7EB' };
const inp = { width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 8px', fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit' };
