const express = require('express');
const cors = require("cors");
const studentProfileRoutes = require("./routes/formroutes");
const authRoutes = require("./routes/authroutes");
const studentProfileRoutes = require("./routes/formroutes");
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", studentProfileRoutes);

app.get("/", (req, res) => {
    res.send("Backend Running");
});

module.exports = app;