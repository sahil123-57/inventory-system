import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for creating a new product row
  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    category: '',
    quantity: '',
    price: '',
    sku: '',
    description: ''
  });

  // Automatically fetch items from FastAPI on screen load
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
    
    // Prepare formatted structured data payloads
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

      // Reset form on complete record registration
      setNewItem({ id: '', name: '', category: '', quantity: '', price: '', sku: '', description: '' });
      fetchItems(); // Trigger UI auto-sync re-fetch
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
      if (!response.ok) throw new Error('Deletion cycle aborted by platform');
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '30px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>📦 Corporate Inventory Control Station</h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Real-time Full-Stack Operations Engine</p>
      </header>

      {/* Grid Layout Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* SIDEBAR FORM: ADD STOCK ITEM */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>Register New Stock Asset</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="number" name="id" placeholder="Unique Numeric Asset ID" value={newItem.id} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="name" placeholder="Product Label Designation" value={newItem.name} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="category" placeholder="Product Department Category" value={newItem.category} onChange={handleInputChange} required style={inputStyle} />
            <input type="number" name="quantity" placeholder="Opening Stock Unit Count" value={newItem.quantity} onChange={handleInputChange} required style={inputStyle} />
            <input type="number" step="0.01" name="price" placeholder="Unit Price Assessment" value={newItem.price} onChange={handleInputChange} required style={inputStyle} />
            <input type="text" name="sku" placeholder="Unique Inventory Stock SKU Code" value={newItem.sku} onChange={handleInputChange} required style={inputStyle} />
            <textarea name="description" placeholder="Optional Item Feature Logs (Optional)" value={newItem.description} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '60px' }} />
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
              Commit Stock Entry to Records
            </button>
          </form>
        </div>

        {/* MAIN DISPLAY: LIVE MASTER LEDGER */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>System Active Stock Ledger</h2>
          
          {loading && <div style={{ color: '#2563eb', fontWeight: 'bold' }}>Scanning databanks for records...</div>}
          {error && <div style={{ color: '#dc2626', fontWeight: 'bold' }}>Error connecting to server pipeline: {error}</div>}
          
          {!loading && !error && items.length === 0 && <div style={{ color: '#64748b' }}>No product footprints stored in database arrays.</div>}

          {!loading && !error && items.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Product Info</th>
                  <th style={thStyle}>SKU Code</th>
                  <th style={thStyle}>Stock Level</th>
                  <th style={thStyle}>Valuation</th>
                  <th style={thStyle, { textAlign: 'center' }}>Purge</th>
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
                      <span style={{ fontWeight: 'bold', color: item.quantity < 15 ? '#b91c1c' : '#15803d' }}>
                        {item.quantity} units
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

const inputStyle = {
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none'
};

const thStyle = {
  padding: '12px 8px',
  color: '#475569',
  fontWeight: '600',
  fontSize: '14px'
};

const tdStyle = {
  padding: '14px 8px',
  fontSize: '14px',
  verticalAlign: 'top'
};

export default App;