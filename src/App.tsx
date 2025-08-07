// src/App.tsx - Updated to use the Dashboard component
import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css'; // Keep your existing CSS if you have it

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;