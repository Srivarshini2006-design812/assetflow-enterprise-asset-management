import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Modal } from "../components/UI";
import { useAuth } from "../AuthContext";

const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function Booking() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/assets").then((all) => {
      const bookable = all.filter((a) => a.bookable);
      setResources(bookable);
      if (bookable.length) setResourceId(bookable[0].id);
    });
  }, []);

  function load() {
    if (!resourceId) return;
    api.get(`/bookings?assetId=${resourceId}&date=${date}`).then(setBookings);
  }
  useEffect(load, [resourceId, date]);

  const resource = resources.find((r) => r.id === resourceId);

  function bookingsAtHour(hour) {
    const h = Number(hour.split(":")[0]);
    return bookings.filter((b) => Number(b.startTime.split(":")[0]) <= h && Number(b.endTime.split(":")[0]) > h && b.status !== "Cancelled");
  }

  function openBookingModal(startTime) {
    setError("");
    const endHour = String(Number(startTime.split(":")[0]) + 1).padStart(2, "0");
    setForm({ assetId: resourceId, resourceName: resource?.name, date, startTime, endTime: `${endHour}:00`, bookedBy: user?.name, department: user?.department, purpose: "" });
    setModal(true);
  }

  async function submitBooking(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/bookings", form);
      setModal(false); load();
    } catch (err) {
      setError(err.data?.message || err.message);
    }
  }

  const mostBooked = useMemo(() => {
    if (!bookings.length) return null;
    return resource?.name;
  }, [bookings, resource]);

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 260px", gap: 20 }}>
        <div>
          <div className="table-toolbar">
            <div className="table-filters">
              <select value={resourceId || ""} onChange={(e) => setResourceId(Number(e.target.value))} style={{ minWidth: 200 }}>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.tag} — {r.name}</option>)}
              </select>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="booking-grid">
              {HOURS.map((h) => {
                const slotBookings = bookingsAtHour(h);
                return (
                  <div className="booking-slot-row" key={h}>
                    <div className="booking-time-label">{h}</div>
                    <div className="booking-slot" onClick={() => slotBookings.length === 0 && openBookingModal(h)}>
                      {slotBookings.length === 0 ? null : slotBookings.map((b) => (
                        <div key={b.id} className="booked">
                          Booked — {b.bookedBy} — {b.startTime} to {b.endTime}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-title mt-0">Quick Stats</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}><strong>Selected:</strong> {resource?.name || "—"}</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}><strong>Bookings today:</strong> {bookings.filter(b => b.status !== "Cancelled").length}</div>
            <div style={{ fontSize: 13 }}><strong>Available now:</strong> {resources.length} resources</div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal title="Book a Slot" onClose={() => setModal(false)}>
          <form onSubmit={submitBooking}>
            <div className="field"><label>Resource</label><input value={form.resourceName || ""} disabled /></div>
            <div className="field-row">
              <div className="field"><label>Start Time</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></div>
              <div className="field"><label>End Time</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></div>
            </div>
            <div className="field"><label>Booked By</label><input value={form.bookedBy || ""} disabled /></div>
            <div className="field"><label>Purpose</label><textarea rows={3} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
            {error && <div className="alert alert-danger">🚫 {error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Book Now</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
