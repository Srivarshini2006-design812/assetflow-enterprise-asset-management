import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/reports/dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="empty-state">Loading dashboard…</div>;
  const { kpis, recentActivity } = data;

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Today's Overview</div>
      <div className="grid grid-4">
        <div className="card kpi-card accent-green">
          <div className="kpi-label">Available</div>
          <div className="kpi-value">{kpis.available}</div>
        </div>
        <div className="card kpi-card accent-teal">
          <div className="kpi-label">Allocated</div>
          <div className="kpi-value">{kpis.allocated}</div>
        </div>
        <div className="card kpi-card accent-orange">
          <div className="kpi-label">Under Maintenance</div>
          <div className="kpi-value">{kpis.underMaintenance}</div>
        </div>
        <div className="card kpi-card accent-red">
          <div className="kpi-label">Maintenance Today</div>
          <div className="kpi-value">{kpis.maintenanceToday}</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card kpi-card">
          <div className="kpi-label">Active Bookings</div>
          <div className="kpi-value">{kpis.activeBookings}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Pending Transfers</div>
          <div className="kpi-value">{kpis.pendingTransfers}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Upcoming Returns</div>
          <div className="kpi-value">{kpis.upcomingReturns}</div>
        </div>
      </div>

      {kpis.overdueReturns > 0 && (
        <div className="alert alert-warning" style={{ marginTop: 20 }}>
          ⚠️ {kpis.overdueReturns} asset{kpis.overdueReturns > 1 ? "s" : ""} overdue for return — flagged for follow-up
        </div>
      )}

      <div className="section-title">Quick Actions</div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => navigate("/assets")}>+ Register Asset</button>
        <button className="btn btn-outline" onClick={() => navigate("/booking")}>Book Resource</button>
        <button className="btn btn-outline" onClick={() => navigate("/maintenance")}>Raise Maintenance Request</button>
      </div>

      <div className="section-title">Recent Activity</div>
      <div className="table-wrap">
        {recentActivity.length === 0 ? (
          <div className="empty-state">No recent activity yet.</div>
        ) : (
          <table>
            <tbody>
              {recentActivity.map((a) => (
                <tr key={a.id}>
                  <td>{a.message}</td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)", width: 140 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
