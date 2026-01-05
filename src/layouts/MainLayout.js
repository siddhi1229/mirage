import { Outlet, Link } from "react-router-dom";
import "./layout.css";

export default function MainLayout() {
  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Sentinel</h2>

        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/sessions">Sessions</Link></li>
            <li><Link to="/logs">Query Logs</Link></li>
            <li><Link to="/audit">Blockchain Audit</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">

        {/* Topbar */}
        <header className="topbar">
          <span>Admin Dashboard</span>
        </header>

        {/* Page Content */}
        <main className="content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
