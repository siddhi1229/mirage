import { useState, useEffect } from "react";
import API from "../services/api";

export default function Audit() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await API.get("/api/blockchain/status");
        setRecords(res.data || []);
        setError("");
      } catch (e) {
        setError("Failed to load audit records");
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
    const interval = setInterval(fetchAudit, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="audit-container loading-state">Loading...</div>;
  if (error) return <div className="audit-container error-state">{error}</div>;

  return (
    <div className="audit-container">
      <h1>Blockchain Audit Trail</h1>
      <div className="audit-info">
        Tier 3 (Malicious) threats are recorded here for immutable evidence.
      </div>

      <div className="audit-records">
        {records.length === 0 ? (
          <div className="no-data-message">
            No Tier 3 threats recorded yet. Run attack bot for 10+ minutes.
          </div>
        ) : (
          records.map((record, idx) => (
            <div key={idx} className="audit-record">
              <div className="audit-record-header">
                <h3>Tier 3 Threat Detected</h3>
                <span className="timestamp-cell">
                  {new Date(record.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="audit-record-details">
                <p><strong>User ID:</strong> <code>{record.userId}</code></p>
                <p><strong>Status:</strong> Confirmed</p>
                <p><strong>Transaction Hash:</strong> <code className="tx-hash">{record.txHash}</code></p>
              </div>
              <div className="audit-record-footer">
                Immutable record stored on blockchain
              </div>
            </div>
          ))
        )}
      </div>

      <div className="blockchain-info">
        <h3>Integration Status</h3>
        <p>Ready for blockchain service integration at localhost:3001</p>
      </div>
    </div>
  );
}
