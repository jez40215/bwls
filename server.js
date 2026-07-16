const express = require("express");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

// Load the downloaded credential key file
const serviceAccount = require("./serviceAccountKey.json");

const app = express();

// Initialize the Firebase Admin App securely using your certificate file
initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://logistic-app-9bd36-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Grab the database instance
const db = getDatabase();

// Serves static assets (like style.css) straight from your main root directory
app.use(express.static(__dirname));

// FIXED: Serves index.html straight from your main root directory
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// API Endpoint for rates
app.get("/api/rates", async (req, res) => {
    try {
        const ref = db.ref("rates");
        ref.once("value", (snapshot) => {
            const data = snapshot.val();
            const ratesArray = data ? Object.values(data) : [];
            res.json(ratesArray);
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch entries from Firebase Realtime DB" });
    }
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running successfully!`);
    console.log(`Computer: http://localhost:${PORT}`);
});