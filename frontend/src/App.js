import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Sessions from './pages/Sessions';
import Logs from './pages/Logs';
import Audit from './pages/Audit';
import Settings from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem('backendUrl') || 'http://localhost:8000'
  );

  const pages = {
    dashboard: <Dashboard backendUrl={backendUrl} />,
    chat: <Chat backendUrl={backendUrl} />,
    sessions: <Sessions backendUrl={backendUrl} />,
    logs: <Logs backendUrl={backendUrl} />,
    audit: <Audit backendUrl={backendUrl} />,
    settings: <Settings backendUrl={backendUrl} setBackendUrl={setBackendUrl} />
  };

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="logo">◉ MIRAGE</h1>
        </div>

        <nav className="topbar-nav">
          <button
            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
            title="Dashboard"
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chat')}
            title="Chat"
          >
            Chat Interface
          </button>
          <button
            className={`nav-btn ${currentPage === 'sessions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('sessions')}
            title="Sessions"
          >
            Active Sessions
          </button>
          <button
            className={`nav-btn ${currentPage === 'audit' ? 'active' : ''}`}
            onClick={() => setCurrentPage('audit')}
            title="Audit"
          >
            Blockchain Audit
          </button>
          <button
            className={`nav-btn ${currentPage === 'logs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('logs')}
            title="Logs"
          >
            Query Logs
          </button>
          <button
            className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
            title="Settings"
          >
            Settings
          </button>
        </nav>

        <div className="topbar-right">
          <div className="status">
            <span className="status-dot online"></span>
            System Online
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        {pages[currentPage]}
      </div>
    </div>
  );
}