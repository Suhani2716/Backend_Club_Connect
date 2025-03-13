const express = require('express');
const path = require('path');
const app = express();

// Import the database connection
const db = require('./db');

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware to parse JSON request bodies
app.use(express.json());  // No need for body-parser in Express 4.16+

// Import and use the event routes
const event_routes = require('./routes/eventRoutes'); 
app.use('/api', event_routes);  

// Import and use the auth routes
const auth_routes = require('./routes/authRoutes');
app.use('/auth', auth_routes);

// Fallback route for SPA (client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);  // ✅ Fixed backticks
});