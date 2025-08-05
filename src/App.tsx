// src/App.tsx - Minimal version for testing
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Requirements Quality Analyzer</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        marginTop: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>Test Interface</h2>
        <textarea 
          placeholder="Enter your requirement here..."
          style={{ width: '100%', height: '100px', marginBottom: '10px' }}
        />
        <button style={{ padding: '10px 20px', backgroundColor: '#1890ff', color: 'white', border: 'none' }}>
          Test Button
        </button>
      </div>
    </div>
  );
}

export default App;