import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, Badge } from "../components/UI";

const TABS = ["Active Allocations", "Transfer Requests", "History"];

export default function Allocation() {
  const [tab, setTab] = useState("Active Allocations");
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [blockInfo, setBlockInfo] = useState(null);

  function loadAll() {
    api.get("/allocations").then(setAllocations);
    api.get("/allocations/transfers").then(setTransfers);
    api.get("/assets").then(setAssets);
    api.get("/org/employees").then(setEmployees);
  }
  useEffect(loadAll, []);

  async function submitAllocation(e) {
    e.preventDefault();
    setError(""); setBlockInfo(null);
    try {
      await api.post("/allocations", form);
      setModal(null); setForm({}); loadAll();
    } catch (err) {
      if (err.data?.error === "double_allocation_blocked") {
        setBlockInfo(err.data);
      } else {
        setError(err.message);
      }
    }
  }

  async function submitTransfer(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/allocations/transfers", form);
      setModal(null); setForm({}); loadAll();
    } catch (err) { setError(err.message); }
  }

  async function returnAsset(id) {
    const conditionNotes = prompt("Condition check-in notes:") || "";
    await api.post(`/allocations/${id}/return`, { conditionNotes });
    loadAll();
  }

  async function decideTransfer(id, action) {
    await api.patch(`/allocations/transfers/${id}`, { action });
    loadAll();
  }

  const active = allocations.filter((a) => a.status === "Active");
  const history = allocations.filter((a) => a.status === "Returned");

  function assetLabel(id) {
    const a = assets.find((x) => x.id === id);
    return a ? `${a.tag} — ${a.name}` : id;
  }

  return (
    <div>
      <div className="tabs">
        {TABS.map((t) => (
          <div key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)} style={{ cursor: "pointer" }}>{t}</div>
        ))}
      </div>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setBlockInfo(null); setModal("allocate"); }}>+ New Allocation</button>
        <button className="btn btn-outline btn-sm" onClick={() => { setForm({}); setModal("transfer"); }}>+ Request Transfer</button>
      </div>

      {tab === "Active Allocations" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Asset</th><th>Held By</th><th>Department</th><th>Allocated</th><th>Expected Return</th><th></th></tr></thead>
            <tbody>
              {active.map((a) => (
                <tr key={a.id}>
                  <td>{assetLabel(a.assetId)}</td>
                  <td>{a.employeeName}</td>
                  <td>{a.department}</td>
                  <td>{a.allocatedDate}</td>
                  <td>{a.expectedReturnDate || "—"} {a.overdue && <Badge value="Overdue" />}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-outline btn-sm" onClick={() => returnAsset(a.id)}>Mark Returned</button></td>
                </tr>
              ))}
              {active.length === 0 && <tr><td colSpan={6}><div className="empty-state">No active allocations.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Transfer Requests" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Request</th><th>Asset</th><th>From</th><th>To</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td>TR-{String(t.id).padStart(3, "0")}</td>
                  <td>{assetLabel(t.assetId)}</td>
                  <td>{t.fromEmployeeName}</td>
                  <td>{t.toEmployeeName}</td>
                  <td><Badge value={t.status} /></td>
                  <td style={{ textAlign: "right" }}>
                    {t.status === "Pending" && (
                      <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                        <button className="btn btn-success btn-sm" onClick={() => decideTransfer(t.id, "Approved")}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => decideTransfer(t.id, "Rejected")}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan={6}><div className="empty-state">No transfer requests.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "History" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Asset</th><th>Employee</th><th>Allocated</th><th>Returned</th><th>Condition Notes</th></tr></thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id}>
                  <td>{assetLabel(a.assetId)}</td>
                  <td>{a.employeeName}</td>
                  <td>{a.allocatedDate}</td>
                  <td>{a.returnedDate}</td>
                  <td>{a.conditionNotes || "—"}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={5}><div className="empty-state">No completed allocations yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === "allocate" && (
        <Modal title="New Allocation" onClose={() => setModal(null)}>
          <form onSubmit={submitAllocation}>
            <div className="field">
              <label>Asset</label>
              <select required onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}>
                <option value="">Select asset…</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.tag} — {a.name} ({a.status})</option>)}
              </select>
            </div>
            <div className="field">
              <label>Allocate To</label>
              <select required onChange={(e) => {
                const emp = employees.find((x) => x.id === Number(e.target.value));
                setForm({ ...form, employeeId: emp?.id, employeeName: emp?.name, department: emp?.department });
              }}>
                <option value="">Select employee…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Expected Return Date (optional)</label><input type="date" onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} /></div>

            {blockInfo && (
              <div className="alert alert-danger">
                🚫 {blockInfo.message}
                <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }} onClick={() => { setModal("transfer"); setBlockInfo(null); }}>
                  Request Transfer
                </button>
              </div>
            )}
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Submit Request</button>
          </form>
        </Modal>
      )}

      {modal === "transfer" && (
        <Modal title="Request Transfer" onClose={() => setModal(null)}>
          <form onSubmit={submitTransfer}>
            <div className="field">
              <label>Asset</label>
              <select required onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}>
                <option value="">Select asset…</option>
                {assets.filter((a) => a.status === "Allocated").map((a) => <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>To (New Holder)</label>
              <select required onChange={(e) => {
                const emp = employees.find((x) => x.id === Number(e.target.value));
                setForm({ ...form, toEmployeeId: emp?.id, toEmployeeName: emp?.name });
              }}>
                <option value="">Select employee…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Reason</label><textarea rows={3} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Submit Request</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
