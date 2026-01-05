import { Outlet, Link, useLocation } from "react-router-dom";
import "./layout.css";

export default function MainLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">▶ MIRAGE</div>

        <nav>
          <ul>
            <li>
              <Link to="/" className={`${isActive("/") ? "active" : ""}`}>
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/chat"
                className={`${isActive("/chat") ? "active" : ""}`}
              >
                💬 Chat Interface
              </Link>
            </li>
            <li>
              <Link
                to="/sessions"
                className={`${isActive("/sessions") ? "active" : ""}`}
              >
                👥 Active Sessions
              </Link>
            </li>
            <li>
              <Link
                to="/audit"
                className={`${isActive("/audit") ? "active" : ""}`}
              >
                ⛓ Blockchain Audit
              </Link>
            </li>
            <li>
              <Link to="/logs" className={`${isActive("/logs") ? "active" : ""}`}>
                📝 Query Logs
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`${isActive("/settings") ? "active" : ""}`}
              >
                ⚙️ Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <span>&gt; MIRAGE SECURITY SYSTEM</span>
        </header>

        {/* Page Content */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}