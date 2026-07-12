export function Modal({ title, onClose, children, width }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <div className="flex between">
          <h3>{title}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BADGE_MAP = {
  Available: "green", Active: "green", Verified: "green", Resolved: "green", Approved: "green", Completed: "green",
  Allocated: "blue", Upcoming: "blue", Ongoing: "blue", Pending: "orange", "Under Maintenance": "orange", Mismatch: "orange",
  Missing: "red", Rejected: "red", Overdue: "red", Lost: "red", Cancelled: "gray", Inactive: "gray", Returned: "gray", Damaged: "red"
};

export function Badge({ value }) {
  const color = BADGE_MAP[value] || "gray";
  return <span className={`badge badge-${color}`}>{value}</span>;
}
