import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, Badge } from "../components/UI";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);

  function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (department) params.set("department", department);
    if (location) params.set("location", location);
    if (status) params.set("status", status);
    api.get(`/assets?${params.toString()}`).then(setAssets);
  }

  useEffect(() => {
    api.get("/org/categories").then(setCategories);
    api.get("/org/departments").then(setDepartments);
  }, []);

  useEffect(load, [q, category, department, location, status]);

  async function submitAsset(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/assets/${editingId}`, form);
      } else {
        await api.post("/assets", form);
      }
      setModal(false); setForm({}); setEditingId(null); load();
    } catch (err) { setError(err.message); }
  }

  async function viewDetails(asset) {
    const full = await api.get(`/assets/${asset.id}`);
    setSelected(full);
  }

  async function deleteAsset(id) {
    if (!confirm("Delete this asset?")) return;
    await api.del(`/assets/${id}`);
    load();
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="table-filters">
          <input placeholder="Search by tag, serial, or name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ minWidth: 150 }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setEditingId(null); setModal(true); }}>+ Register Asset</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Status</th><th>Location</th><th></th></tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.tag}</td>
                <td>{a.name}</td>
                <td>{a.category}</td>
                <td><Badge value={a.status} /></td>
                <td>{a.location}</td>
                <td style={{ textAlign: "right" }}>
                  <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => viewDetails(a)}>View</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setForm(a); setEditingId(a.id); setModal(true); }}>Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => deleteAsset(a.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={6}><div className="empty-state">No assets match your filters.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>Showing {assets.length} of {assets.length} assets</div>

      {modal && (
        <Modal title={editingId ? "Edit Asset" : "Register Asset"} onClose={() => { setModal(false); setForm({}); setEditingId(null); }}>
          <form onSubmit={submitAsset}>
            <div className="field"><label>Asset Name</label><input required value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Asset Tag / ID</label><input value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></div>
            <div className="field">
              <label>Category</label>
              <select required value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field"><label>Location</label><input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="field">
                <label>Department</label>
                <select value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">—</option>
                  {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Purchase Cost</label><input type="number" value={form.acquisitionCost || 0} onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })} /></div>
              <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ marginTop: 22 }}>Bookable Resource</label>
                <input type="checkbox" checked={!!form.bookable} onChange={(e) => setForm({ ...form, bookable: e.target.checked })} />
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Purchase Date</label><input type="date" value={form.acquisitionDate || ""} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} /></div>
              <div className="field"><label>Warranty Expiry</label><input type="date" value={form.warrantyExpiryDate || ""} onChange={(e) => setForm({ ...form, warrantyExpiryDate: e.target.value })} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Serial Number</label><input value={form.serialNumber || ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
              <div className="field">
                <label>Status</label>
                <select value={form.status || "Available"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Available</option><option>Allocated</option><option>Under Maintenance</option><option>Retired</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Condition</label>
              <select value={form.condition || "Good"} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option>Good</option><option>Fair</option><option>Damaged</option><option>Retired</option>
              </select>
            </div>
            <div className="field"><label>Notes</label><textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Save</button>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`${selected.tag} — ${selected.name}`} onClose={() => setSelected(null)}>
          <p className="muted">{selected.category} · {selected.location} · <Badge value={selected.status} /></p>
          <div className="section-title">Allocation History</div>
          {selected.allocationHistory.length === 0 ? <div className="muted">No allocations yet.</div> :
            selected.allocationHistory.map((h) => (
              <div key={h.id} style={{ fontSize: 13, marginBottom: 6 }}>
                {h.allocatedDate}: {h.status === "Active" ? "Allocated to" : "Returned by"} {h.employeeName}
              </div>
            ))}
          <div className="section-title">Maintenance History</div>
          {selected.maintenanceHistory.length === 0 ? <div className="muted">No maintenance records.</div> :
            selected.maintenanceHistory.map((m) => (
              <div key={m.id} style={{ fontSize: 13, marginBottom: 6 }}>{m.requestedDate}: {m.description} — <Badge value={m.status} /></div>
            ))}
        </Modal>
      )}
    </div>
  );
}
