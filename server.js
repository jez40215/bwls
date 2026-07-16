const express = require("express");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const app = express();

// Initialize Firebase
initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL:
        "https://logistic-app-9bd36-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Get Firebase database
const db = getDatabase();

// Serve static files
app.use(express.static(__dirname));

// Home page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// API endpoint to get rates
app.get("/api/rates", async (req, res) => {
    try {
        const ref = db.ref("rates");

        ref.once("value", (snapshot) => {
            const data = snapshot.val();

            const ratesArray = data
                ? Object.keys(data).map((key) => ({
                      id: key,
                      ...data[key]
                  }))
                : [];

            res.json(ratesArray);
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch entries from Firebase Realtime Database"
        });
    }
});

// Render provides the PORT automatically
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});