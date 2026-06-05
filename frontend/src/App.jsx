import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    category: '',
    quantity: '',
    price: '',
    sku: '',
    description: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/items');
      if (!response.ok) throw new Error('Failed to extract products list');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: parseInt(newItem.id),
      name: newItem.name,
      category: newItem.category,
      quantity: parseInt(newItem.quantity),
      price: parseFloat(newItem.price),
      sku: newItem.sku,
      description: newItem.description || null
    };

    try {
      const response = await fetch('http://localhost:8000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to populate record');
      }

      setNewItem({ id: '', name: '', category: '', quantity: '', price: '', sku: '', description: '' });
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm(`Are you sure you want to remove item ID #${itemId}?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Deletion cycle aborted');
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // ANALYTICS CALCULATIONS
  const totalValuation = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockAlertsCount = items.filter(item => item.quantity < 15).length;

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '30px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>📦 Corporate Inventory Control Station</h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Real-time Full-Stack Operations Engine</p>
      </header>

      {/* NEW STATS ANALYTICS BANNER ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Inventory Valuation</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginTop: '5px' }}>${totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total On-Hand Stock Units</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginTop: '5px' }}>{totalItemsCount} units</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Critical Low Stock Alert Items</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: lowStockAlertsCount > 0 ? '#ef4444' : '#1e293b', marginTop: '5px' }}>{lowStockAlertsCount} alerts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* SIDEBAR FORM */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>Register New Stock Asset</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="number" name="id" placeholder="Unique Numeric Asset ID" value={newItem.id} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="name" placeholder="Product Label Designation" value={newItem.name} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="category" placeholder="Product Department Category" value={newItem.category} onChange={handleInputChange} required style={inputStyle} />
            <input type="number" name="quantity" placeholder="Opening Stock Unit Count" value={newItem.quantity} onChange={handleInputChange} required style={inputStyle} />
            <input type="number" step="0.01" name="price" placeholder="Unit Price Assessment" value={newItem.price} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="sku" placeholder="Unique Inventory Stock SKU Code" value={newItem.sku} onChange={handleInputChange} required style={inputStyle} />
            <textarea name="description" placeholder="Optional Item Feature Logs" value={newItem.description} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '60px' }} />
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              Commit Stock Entry to Records
            </button>
          </form>
        </div>

        {/* LIVE MASTER LEDGER DISPLAY */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>System Active Stock Ledger</h2>
          
          {loading && <div style={{ color: '#2563eb', fontWeight: 'bold' }}>Scanning databanks for records...</div>}
          {error && <div style={{ color: '#dc2626', fontWeight: 'bold' }}>Error connecting to server pipeline: {error}</div>}

          {!loading && !error && items.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Product Info</th>
                  <th style={thStyle}>SKU Code</th>
                  <th style={thStyle}>Stock Level</th>
                  <th style={thStyle}>Valuation</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Purge</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}><span style={{ fontWeight: 'bold', color: '#64748b' }}>#{item.id}</span></td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 'bold' }}>{item.category}</div>
                      {item.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{item.description}</div>}
                    </td>
                    <td style={tdStyle}><code style={{ backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>{item.sku}</code></td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 'bold', color: item.quantity < 15 ? '#ef4444' : '#10b981' }}>
                        {item.quantity} units {item.quantity < 15 && '⚠️'}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: '600' }}>${item.price.toFixed(2)}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' };
const thStyle = { padding: '12px 8px', color: '#475569', fontWeight: '600', fontSize: '14px' };
const tdStyle = { padding: '14px 8px', fontSize: '14px', verticalAlign: 'top' };

export default App;