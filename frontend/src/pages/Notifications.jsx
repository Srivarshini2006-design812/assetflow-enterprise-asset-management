import { useEffect, useState } from "react";
import { api } from "../api";

const FILTERS = ["All", "Alerts", "Tasks", "System"];
const FILTER_MAP = {
  Alerts: ["Alert", "Audit"],
  Tasks: ["Maintenance", "Transfer", "Allocation", "Booking"],
  System: ["Org", "System", "Asset"]
};

export default function Notifications() {
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    email: true,
    inApp: true,
    maintenanceAlerts: true,
    auditAlerts: true,
    bookingReminders: true
  });
  const [filter, setFilter] = useState("All");

  function load() {
    api.get("/notifications/logs").then(setLogs);
    api.get("/notifications").then(setNotifications);
    api.get("/notifications/preferences").then(setPreferences);
  }
  useEffect(load, []);

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    load();
  }

  async function togglePreference(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    await api.patch("/notifications/preferences", next);
  }

  const filtered = filter === "All" ? logs : logs.filter((l) => (FILTER_MAP[filter] || []).includes(l.type));
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="table-toolbar">
        <div className="tabs" style={{ borderBottom: "none", marginBottom: 0 }}>
          {FILTERS.map((f) => (
            <div key={f} className={"tab" + (filter === f ? " active" : "")} onClick={() => setFilter(f)} style={{ cursor: "pointer" }}>{f}</div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all as read {unread > 0 && `(${unread})`}</button>
      </div>

      <div className="grid grid-2" style={{ gap: 20, alignItems: "start" }}>
        <div className="table-wrap">
          {filtered.length === 0 ? <div className="empty-state">No activity yet.</div> : (
            <table>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{l.message}</td>
                    <td style={{ width: 120 }}><span className="badge badge-blue">{l.type}</span></td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)", width: 150 }}>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="section-title mt-0">Notification Preferences</div>
          <div className="field-row" style={{ alignItems: "center" }}>
            <label>Email Notifications</label>
            <input type="checkbox" checked={preferences.email} onChange={(e) => togglePreference("email", e.target.checked)} />
          </div>
          <div className="field-row" style={{ alignItems: "center" }}>
            <label>In-App Notifications</label>
            <input type="checkbox" checked={preferences.inApp} onChange={(e) => togglePreference("inApp", e.target.checked)} />
          </div>
          <div className="field-row" style={{ alignItems: "center" }}>
            <label>Maintenance Alerts</label>
            <input type="checkbox" checked={preferences.maintenanceAlerts} onChange={(e) => togglePreference("maintenanceAlerts", e.target.checked)} />
          </div>
          <div className="field-row" style={{ alignItems: "center" }}>
            <label>Audit Alerts</label>
            <input type="checkbox" checked={preferences.auditAlerts} onChange={(e) => togglePreference("auditAlerts", e.target.checked)} />
          </div>
          <div className="field-row" style={{ alignItems: "center" }}>
            <label>Booking Reminders</label>
            <input type="checkbox" checked={preferences.bookingReminders} onChange={(e) => togglePreference("bookingReminders", e.target.checked)} />
          </div>
        </div>
      </div>
    </div>
  );
}
