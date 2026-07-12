const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/org", require("./routes/org"));
app.use("/api/assets", require("./routes/assets"));
app.use("/api/allocations", require("./routes/allocations"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/audits", require("./routes/audits"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AssetFlow backend running on http://localhost:${PORT}`));
