const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// 1. Middleware Configurations
app.use(cors());
app.use(express.json());
app.use(express.static("public")); 

// 2. MySQL Database Connection Configuration
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'worldwide',
    database: 'ph_shipping_freight_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL Database:', err);
        return;
    }
    console.log('✅ Connected successfully to MySQL: ph_shipping_freight_db');
});

// 3. Page Routing
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// 4. API ROUTE: Fetch metadata for dropdown selectors (Destinations & Carriers)
app.get('/api/metadata', (req, res) => {
    const destinationsQuery = "SELECT port_name FROM destinations ORDER BY port_name ASC";
    const carriersQuery = "SELECT carrier_name FROM shipping_lines ORDER BY carrier_name ASC";

    db.query(destinationsQuery, (err, destResults) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query(carriersQuery, (err, carrierResults) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                destinations: destResults.map(r => r.port_name),
                carriers: carrierResults.map(r => r.carrier_name)
            });
        });
    });
});

// 5. API ROUTE: Fetch all registered freight rates for matrix rendering
app.get('/api/rates', (req, res) => {
    const query = `
        SELECT 
            r.rate_id,
            o.port_name AS origin,
            o.cargo_type AS cargoType,
            d.port_name AS destination,
            c.carrier_name AS shippingLine,
            r.container_size AS containerSize,
            r.freight_rate AS freightRate,
            r.transit_time_days AS transitTime,
            DATE_FORMAT(r.valid_from, '%Y-%m-%d') AS validityDatestart,
            DATE_FORMAT(r.valid_to, '%Y-%m-%d') AS validityDatend
        FROM freight_rates r
        JOIN origins o ON r.origin_id = o.origin_id
        JOIN destinations d ON r.destination_id = d.destination_id
        JOIN shipping_lines c ON r.carrier_id = c.carrier_id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 6. API ROUTE: Securely insert a new Freight Document into the relational schema
app.post('/api/rates', (req, res) => {
    const { 
        shippingLine, 
        origin, 
        destination, 
        cargoType, 
        containerSize, 
        freightRate, 
        transitTime, 
        validFrom, 
        validTo 
    } = req.body;

    const query = `
        INSERT INTO freight_rates (origin_id, destination_id, carrier_id, container_size, freight_rate, transit_time_days, valid_from, valid_to)
        VALUES (
            (SELECT origin_id FROM origins WHERE port_name = ? AND cargo_type = ? LIMIT 1),
            (SELECT destination_id FROM destinations WHERE port_name = ? LIMIT 1),
            (SELECT carrier_id FROM shipping_lines WHERE carrier_name = ? LIMIT 1),
            ?, ?, ?, ?, ?
        )
    `;

    const values = [
        origin, 
        cargoType, 
        destination, 
        shippingLine, 
        containerSize, 
        freightRate, 
        transitTime, 
        validFrom, 
        validTo
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Database Insertion Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, insertedId: result.insertId });
    });
});

// 7. App Execution
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running!`);
    console.log(`Computer: http://localhost:${PORT}`);
});