import { useState, useEffect } from "react";
import API from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_sessions: 0,
    tier1_clean: 0,
    tier2_suspicious: 0,
    tier3_malicious: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
        setError("");
      } catch (e) {
        setError(`Failed to load statistics`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="dashboard loading-state">Loading...</div>;
  if (error) return <div className="dashboard error-state">{error}</div>;

  const total = stats.total_sessions || 0;
  const tier1Pct = total > 0 ? ((stats.tier1_clean / total) * 100).toFixed(0) : 0;
  const tier2Pct = total > 0 ? ((stats.tier2_suspicious / total) * 100).toFixed(0) : 0;
  const tier3Pct = total > 0 ? ((stats.tier3_malicious / total) * 100).toFixed(0) : 0;

  return (
    <div className="dashboard">
      <h1>Security Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-value">{total}</div>
          <div className="dashboard-card-label">Total Sessions</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-value">{stats.tier1_clean}</div>
          <div className="dashboard-card-label">Clean (Tier 1)</div>
          <div className="dashboard-card-percent">{tier1Pct}%</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-value">{stats.tier2_suspicious}</div>
          <div className="dashboard-card-label">Suspicious (Tier 2)</div>
          <div className="dashboard-card-percent">{tier2Pct}%</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-value">{stats.tier3_malicious}</div>
          <div className="dashboard-card-label">Malicious (Tier 3)</div>
          <div className="dashboard-card-percent">{tier3Pct}%</div>
        </div>
      </div>

      <div className="distribution-container">
        <h2>Threat Distribution</h2>
        <div className="distribution-bar">
          <div className="bar-segment tier1" style={{ width: `${tier1Pct}%` }}>
            {tier1Pct > 5 && `${tier1Pct}%`}
          </div>
          <div className="bar-segment tier2" style={{ width: `${tier2Pct}%` }}>
            {tier2Pct > 5 && `${tier2Pct}%`}
          </div>
          <div className="bar-segment tier3" style={{ width: `${tier3Pct}%` }}>
            {tier3Pct > 5 && `${tier3Pct}%`}
          </div>
        </div>
      </div>

      <div className="system-status">
        <h3>System Status</h3>
        <p>
          Total Active Threats: <span className={`status-value ${stats.tier2_suspicious + stats.tier3_malicious > 0 ? 'warning' : 'safe'}`}>
            {stats.tier2_suspicious + stats.tier3_malicious}
          </span>
        </p>
        <p>Last Updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
