import { useEffect, useState } from "react";
import { api } from "../api";

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/reports/analytics").then(setData);
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Category", "Utilization %"],
      ...data.utilizationByCategory.map((r) => [r.category, r.utilizationPct])
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
      </div>

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
        <button className="btn btn-outline" onClick={() => window.print()}>Print Report</button>
      </div>
    </div>
  );
}
