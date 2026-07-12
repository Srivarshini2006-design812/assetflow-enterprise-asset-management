import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/org-setup", icon: "⚙️", label: "Organization setup", adminOnly: true },
  { to: "/assets", icon: "📦", label: "Assets" },
  { to: "/allocation", icon: "🔄", label: "Allocation & Transfer" },
  { to: "/booking", icon: "📅", label: "Resource Booking" },
  { to: "/maintenance", icon: "🔧", label: "Maintenance" },
  { to: "/audit", icon: "📋", label: "Audit" },
  { to: "/reports", icon: "📊", label: "Reports" },
  { to: "/notifications", icon: "🔔", label: "Notifications" }
];

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/org-setup": "Organization Setup",
  "/assets": "Assets",
  "/allocation": "Allocation & Transfer",
  "/booking": "Resource Booking",
  "/maintenance": "Maintenance",
  "/audit": "Audit",
  "/reports": "Reports & Analytics",
  "/notifications": "Activity Logs & Notifications"
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function initials(name) {
    return (name || "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }

  const currentPath = "/" + window.location.pathname.split("/")[1];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">AF</div>
          AssetFlow
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "Admin").map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">AssetFlow v1.0 · Hackathon build</div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1>{PAGE_TITLES[currentPath] || "AssetFlow"}</h1>
          <div className="user-menu">
            <div>
              <div className="user-name" style={{ textAlign: "right" }}>{user?.name}</div>
              <div className="user-role" style={{ textAlign: "right" }}>{user?.role}</div>
            </div>
            <div className="avatar">{initials(user?.name)}</div>
            <button className="logout-btn" onClick={() => { logout(); navigate("/login"); }}>Log out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
