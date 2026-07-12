import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const DEMO_USERS = [
  { label: "Admin", email: "admin@assetflow.com", password: "admin123" },
  { label: "Asset Manager", email: "rohan@assetflow.com", password: "rohan123" },
  { label: "Department Head", email: "sana@assetflow.com", password: "sana123" },
  { label: "Employee", email: "priya@assetflow.com", password: "priya123" }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo">AF</div>
            <span>AssetFlow</span>
          </div>
          <h2>Log in</h2>
          <div className="sub">Track, allocate, and maintain your organization's assets.</div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="auth-footer">
            <div style={{ marginBottom: 10 }}><a href="#forgot">Forgot password?</a></div>
            New here? Sign up creates an employee account — admin roles are assigned later.
            <div style={{ marginTop: 10 }}>
              <Link to="/signup" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>Create Account</Link>
            </div>
          </div>

          <div className="demo-credentials">
            <div className="section-title mt-0">Try a demo account</div>
            <div className="demo-credential-grid">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  className="demo-credential"
                  onClick={() => { setEmail(user.email); setPassword(user.password); }}
                >
                  <strong>{user.label}</strong>
                  <span>{user.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-easter-egg">Content Clam · Imaginative Raven · Authorized Ostrich</div>
      </div>
    </div>
  );
}
