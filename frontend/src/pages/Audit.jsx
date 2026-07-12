import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, Badge } from "../components/UI";

export default function Audit() {
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  function load() {
    api.get("/audits").then(setCycles);
    api.get("/org/departments").then(setDepartments);
  }
  useEffect(load, []);

  const active = cycles.filter((c) => c.status === "Active");
  const closed = cycles.filter((c) => c.status === "Closed");

  async function markItem(cycleId, assetId, auditStatus) {
    await api.patch(`/audits/${cycleId}/items/${assetId}`, { auditStatus });
    load();
  }

  async function closeCycle(id) {
    if (!confirm("Close this audit cycle? This will lock it and update flagged asset statuses.")) return;
    await api.post(`/audits/${id}/close`);
    load();
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/audits", form);
      setModal(false); setForm({}); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div />
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>+ Start New Audit</button>
      </div>

      {active.map((cycle) => {
        const done = cycle.items.filter((i) => i.auditStatus !== "Pending").length;
        const pct = cycle.items.length ? Math.round((done / cycle.items.length) * 100) : 0;
        const flagged = cycle.items.filter((i) => ["Missing", "Damaged", "Mismatch"].includes(i.auditStatus));
        return (
          <div className="card" key={cycle.id} style={{ marginBottom: 20 }}>
            <div className="flex between">
              <div>
                <strong>{cycle.title}</strong>
                <div className="muted" style={{ fontSize: 12.5 }}>Auditors: {cycle.auditors.join(", ") || "Unassigned"}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => closeCycle(cycle.id)}>Close Audit Cycle</button>
            </div>
            <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>{pct}% complete</div>

            {flagged.length > 0 && (
              <div className="alert alert-warning">⚠️ {flagged.length} assets flagged — discrepancy report generated automatically</div>
            )}

            <table>
              <thead><tr><th>Asset</th><th>Expected Location</th><th>Verification</th><th>Status</th></tr></thead>
              <tbody>
                {cycle.items.map((item) => (
                  <tr key={item.assetId}>
                    <td>{item.assetTag} — {item.assetName}</td>
                    <td>{item.expectedLocation}</td>
                    <td>
                      <input
                        defaultValue={item.verification || ""}
                        placeholder="Observed location"
                        onBlur={(e) => markItem(cycle.id, item.assetId, e.target.value === item.expectedLocation ? "Verified" : (item.auditStatus === "Pending" ? "Mismatch" : item.auditStatus))}
                      />
                    </td>
                    <td>
                      <select value={item.auditStatus} onChange={(e) => markItem(cycle.id, item.assetId, e.target.value)}>
                        <option>Pending</option><option>Verified</option><option>Missing</option><option>Damaged</option><option>Mismatch</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {active.length === 0 && <div className="empty-state">No active audit cycles.</div>}

      <div className="section-title">Previous Audits</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Audit</th><th>Department</th><th>Auditors</th><th>Status</th><th>Discrepancies</th></tr></thead>
          <tbody>
            {closed.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.department || "—"}</td>
                <td>{c.auditors.join(", ") || "—"}</td>
                <td><Badge value="Completed" /></td>
                <td>{c.discrepancies?.length || 0}</td>
              </tr>
            ))}
            {closed.length === 0 && <tr><td colSpan={5}><div className="empty-state">No completed audits yet.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Start New Audit" onClose={() => setModal(false)}>
          <form onSubmit={submit}>
            <div className="field"><label>Title</label><input required placeholder="e.g. Q3 audit: Engineering dept" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field">
              <label>Department</label>
              <select onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Location</label><input onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="field-row">
              <div className="field"><label>Start Date</label><input type="date" onChange={(e) => setForm({ ...form, dateRangeStart: e.target.value })} /></div>
              <div className="field"><label>End Date</label><input type="date" onChange={(e) => setForm({ ...form, dateRangeEnd: e.target.value })} /></div>
            </div>
            <div className="field"><label>Auditors (comma-separated)</label><input onChange={(e) => setForm({ ...form, auditors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Start Audit</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
