require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Define MongoDB Schema & Model
const BulgeSchema = new mongoose.Schema({
    id: String,
    engineDetected: { type: Boolean, default: false },
    rackId: String,
    wagons: [
        {
            wagonNo: Number,
            status: String,
            timestamp: Date
        }
    ],
    breakdown: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const BulgeRecord = mongoose.model("BulgeRecord", BulgeSchema);

// Store the current train session
let currentTrain = null;

// API to Check Bulge & Store Data
app.post("/check-bulge", async (req, res) => {
    try {
        const { rackId, breakdown, status } = req.body;

        if (!rackId) {
            return res.status(400).json({ error: "Rack ID is required." });
        }

        if (breakdown === false) {
            currentTrain = null;
            return res.json({ message: "Breakdown detected. Train session ended and reset." });
        }

        if (breakdown === true && !currentTrain) {
            currentTrain = new BulgeRecord({
                id: new mongoose.Types.ObjectId().toString(),
                engineDetected: true,
                rackId,
                wagons: [],
                breakdown: true
            });

            await currentTrain.save();
            return res.json({ message: "Engine automatically detected. Train session started.", id: currentTrain.id });
        }

        if (!currentTrain) {
            return res.status(400).json({ error: "No active train session. Please start with breakdown: true." });
        }

        if (!status) {
            return res.status(400).json({ error: "Sensor has not scanned the wagon. No data recorded." });
        }

        let wagonNo = currentTrain.wagons.length + 1;

        currentTrain.wagons.push({ wagonNo, status, timestamp: new Date() });
        await currentTrain.save();

        return res.json({
            id: currentTrain.id,
            rackId: currentTrain.rackId,
            wagons: currentTrain.wagons,
            totalWagons: currentTrain.wagons.length,
            message: `Wagon ${wagonNo} data stored successfully.`
        });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// API to Retrieve All Records
app.get("/get-records", async (req, res) => {
    try {
        const records = await BulgeRecord.find();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
 