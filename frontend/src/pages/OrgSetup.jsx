import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, Badge } from "../components/UI";

const TABS = ["Departments", "Categories", "Employees"];

export default function OrgSetup() {
  const [tab, setTab] = useState("Departments");
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  function loadAll() {
    api.get("/org/departments").then(setDepartments);
    api.get("/org/categories").then(setCategories);
    api.get("/org/employees").then(setEmployees);
  }

  useEffect(loadAll, []);

  async function submitDept(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/org/departments", form);
      setModal(null); setForm({}); loadAll();
    } catch (err) { setError(err.message); }
  }

  async function submitCategory(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/org/categories", form);
      setModal(null); setForm({}); loadAll();
    } catch (err) { setError(err.message); }
  }

  async function submitEmployee(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/org/employees", form);
      setModal(null); setForm({}); loadAll();
    } catch (err) { setError(err.message); }
  }

  async function promote(id, role) {
    await api.patch(`/org/employees/${id}/role`, { role });
    loadAll();
  }

  return (
    <div>
      <div className="tabs">
        {TABS.map((t) => (
          <div key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)} style={{ cursor: "pointer" }}>
            {t}
          </div>
        ))}
      </div>

      {tab === "Departments" && (
        <>
          <div className="table-toolbar">
            <div />
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal("dept"); }}>+ Add Department</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Department</th><th>Head</th><th>Parent Dept</th><th>Status</th></tr></thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.head || "—"}</td>
                    <td>{departments.find((p) => p.id === d.parentId)?.name || "—"}</td>
                    <td><Badge value={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Categories" && (
        <>
          <div className="table-toolbar">
            <div />
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal("category"); }}>+ Add Category</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Category</th><th>Warranty (months)</th><th>Status</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.warrantyPeriodMonths || "—"}</td>
                    <td><Badge value={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Employees" && (
        <>
          <div className="table-toolbar">
            <div />
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal("employee"); }}>+ Add Employee</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee Name</th><th>Department</th><th>Role</th><th>Status</th><th>Promote</th></tr></thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.department || "—"}</td>
                    <td><Badge value={e.role} /></td>
                    <td><Badge value={e.status} /></td>
                    <td>
                      <select defaultValue="" onChange={(ev) => ev.target.value && promote(e.id, ev.target.value)}>
                        <option value="">Set role…</option>
                        <option value="Employee">Employee</option>
                        <option value="DeptHead">Department Head</option>
                        <option value="AssetManager">Asset Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal === "dept" && (
        <Modal title="Add Department" onClose={() => setModal(null)}>
          <form onSubmit={submitDept}>
            <div className="field"><label>Name</label><input required onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Head</label><input onChange={(e) => setForm({ ...form, head: e.target.value })} /></div>
            <div className="field">
              <label>Parent Department</label>
              <select onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">None</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select onChange={(e) => setForm({ ...form, status: e.target.value })} defaultValue="Active">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Save</button>
          </form>
        </Modal>
      )}

      {modal === "category" && (
        <Modal title="Add Category" onClose={() => setModal(null)}>
          <form onSubmit={submitCategory}>
            <div className="field"><label>Name</label><input required onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Warranty period (months)</label><input type="number" onChange={(e) => setForm({ ...form, warrantyPeriodMonths: Number(e.target.value) })} /></div>
            <div className="field">
              <label>Status</label>
              <select onChange={(e) => setForm({ ...form, status: e.target.value })} defaultValue="Active">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Save</button>
          </form>
        </Modal>
      )}

      {modal === "employee" && (
        <Modal title="Add Employee" onClose={() => setModal(null)}>
          <form onSubmit={submitEmployee}>
            <div className="field"><label>Name</label><input required onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Temporary password</label><input type="password" required onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="field">
              <label>Department</label>
              <select onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
