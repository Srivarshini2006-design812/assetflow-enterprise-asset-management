import { useEffect, useState } from "react";
import { api } from "../api";

export default function Reports() {
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ department: "", category: "", from: "", to: "" });

  function load() {
    const params = new URLSearchParams();
    if (filters.department) params.set("department", filters.department);
    if (filters.category) params.set("category", filters.category);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    api.get(`/reports/analytics?${params.toString()}`).then(setData);
  }

  useEffect(() => {
    api.get("/org/departments").then(setDepartments);
    api.get("/org/categories").then(setCategories);
    load();
  }, []);

  useEffect(() => {
    load();
  }, [filters.department, filters.category, filters.from, filters.to]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Section", "Value"],
      ...data.utilizationByCategory.map((r) => [`Utilization:${r.category}`, `${r.utilizationPct}%`]),
      ...data.mostUsed.map((r) => [`MostUsed:${r.name}`, `${r.count} bookings`]),
      ...data.idleAssets.map((a) => [`IdleAsset:${a.tag}`, a.name]),
      ...data.nearingRetirement.map((a) => [`Retiring:${a.tag}`, `${a.ageYears} years`]),
      ...data.departmentSummary.map((d) => [`Department:${d.department}`, `${d.allocatedAssets} allocated`]),
      ...Object.entries(data.maintenanceByMonth).map(([month, count]) => [`Maintenance:${month}`, `${count} requests`])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assetflow-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return <div className="empty-state">Loading analytics…</div>;

  return (
    <div>
      <div className="table-toolbar" style={{ alignItems: "end" }}>
        <div className="table-filters">
          <input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
          <input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
          <select value={filters.department} onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={load}>Generate Report</button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title mt-0">Most Used Resources</div>
          {data.mostUsed.length === 0 ? <div className="muted">No booking activity yet.</div> :
            data.mostUsed.map((m) => (
              <div key={m.name} className="flex between" style={{ fontSize: 13.5, marginBottom: 8 }}>
                <span>{m.name}</span><strong>{m.count} bookings</strong>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="section-title mt-0">Idle Assets</div>
          {data.idleAssets.length === 0 ? <div className="muted">No idle assets detected.</div> :
            data.idleAssets.map((a) => (
              <div key={a.tag} className="flex between" style={{ fontSize: 13.5, marginBottom: 8 }}>
                <span>{a.tag} — {a.name}</span><span className="muted">unused</span>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="section-title mt-0">Nearing Retirement</div>
          {data.nearingRetirement.length === 0 ? <div className="muted">No assets flagged.</div> :
            data.nearingRetirement.map((a) => (
              <div key={a.tag} className="flex between" style={{ fontSize: 13.5, marginBottom: 8 }}>
                <span>{a.tag} — {a.name}</span><span className="muted">{a.ageYears} yrs old</span>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="section-title mt-0">Department-wise Allocation</div>
          {data.departmentSummary.map((d) => (
            <div key={d.department} className="flex between" style={{ fontSize: 13.5, marginBottom: 8 }}>
              <span>{d.department}</span><strong>{d.allocatedAssets} allocated</strong>
            </div>
          ))}
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="section-title mt-0">Utilization by Category</div>
          {data.utilizationByCategory.map((c) => (
            <div key={c.category} style={{ marginBottom: 12 }}>
              <div className="flex between" style={{ fontSize: 13, marginBottom: 4 }}>
                <span>{c.category}</span><span>{c.utilizationPct}%</span>
              </div>
              <div className="progress-bar"><div style={{ width: `${c.utilizationPct}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="section-title mt-0">Maintenance Trend</div>
          {Object.entries(data.maintenanceByMonth).length === 0 ? <div className="muted">No maintenance activity available for the selected window.</div> : (
            Object.entries(data.maintenanceByMonth).map(([month, count]) => (
              <div key={month} style={{ marginBottom: 12 }}>
                <div className="flex between" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span>{month}</span><span>{count} requests</span>
                </div>
                <div className="progress-bar"><div style={{ width: `${Math.min(count * 20, 100)}%` }} /></div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
        <button className="btn btn-outline" onClick={() => window.print()}>Print Report</button>
      </div>
    </div>
  );
}
