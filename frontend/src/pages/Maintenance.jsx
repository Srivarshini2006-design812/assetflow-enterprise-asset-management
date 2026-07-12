import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal } from "../components/UI";

const COLUMNS = [
  { key: "Pending", label: "Pending", next: "Approved", nextLabel: "Approve", reject: true },
  { key: "Approved", label: "Approved", next: "Resolved", nextLabel: "Resolve" },
  { key: "Resolved", label: "Resolved" }
];

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  function load() {
    api.get("/maintenance").then(setRequests);
    api.get("/assets").then(setAssets);
  }
  useEffect(load, []);

  function assetLabel(id) {
    const a = assets.find((x) => x.id === id);
    return a ? a.tag : id;
  }

  async function transition(id, status) {
    await api.patch(`/maintenance/${id}/status`, { status });
    load();
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/maintenance", form);
      setModal(false); setForm({}); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div />
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>+ Request Maintenance</button>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div className="kanban-col" key={col.key}>
            <h4>{col.label} ({requests.filter((r) => r.status === col.key).length})</h4>
            {requests.filter((r) => r.status === col.key).map((r) => (
              <div className="kanban-card" key={r.id}>
                <div className="tag">{assetLabel(r.assetId)}</div>
                <div className="desc">{r.description} · {r.priority} priority</div>
                {col.next && (
                  <div className="btn-row">
                    <button className="btn btn-success btn-sm" onClick={() => transition(r.id, col.next)}>{col.nextLabel}</button>
                    {col.reject && <button className="btn btn-danger btn-sm" onClick={() => transition(r.id, "Rejected")}>Reject</button>}
                  </div>
                )}
              </div>
            ))}
            {requests.filter((r) => r.status === col.key).length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>No requests</div>}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Request Maintenance" onClose={() => setModal(false)}>
          <form onSubmit={submit}>
            <div className="field">
              <label>Asset</label>
              <select required onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}>
                <option value="">Select asset…</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Type</label>
                <select onChange={(e) => setForm({ ...form, type: e.target.value })} defaultValue="Corrective">
                  <option>Preventive</option><option>Corrective</option><option>Emergency</option>
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select onChange={(e) => setForm({ ...form, priority: e.target.value })} defaultValue="Medium">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Description</label><textarea rows={3} required onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Submit</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
