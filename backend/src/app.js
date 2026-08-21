const express = require('express');
const app = express(); 
app.use(express.json());



const cors = require("cors");
const authRoutes = require("./routes/authroutes");
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use("/api/auth", authRoutes);

app.get("/", (req,res)=>{
    res.send("Backend Running");
})
module.exports = app;