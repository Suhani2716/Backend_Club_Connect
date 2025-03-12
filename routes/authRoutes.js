const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import the database connection
const router = express.Router();

const allowedRoles = ['host', 'guest'];

// LOGIN ROUTE
router.post('/login', (req, res) => {
    const { email, password, role } = req.body;

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    const table = role === 'host' ? 'host_details' : 'guest_details_final';
    const query = `SELECT * FROM ${table} WHERE email_id = ?`;

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error during login:', err); // Log the error details
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user.id, role }, 'secretkey', { expiresIn: '1h' });
            res.status(200).json({ message: 'Login successful', token, role });
        });
    });
});

// REGISTER ROUTE
router.post('/register', (req, res) => {
    const { name, age, gender, phone_number, email_id, password, role } = req.body;

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err); // Log the error details
            return res.status(500).json({ error: 'Error hashing password' });
        }

        const table = role === 'host' ? 'host_details' : 'guest_details_final';
        const query = `INSERT INTO ${table} (name, age, gender, phone_number, email_id, password) VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(query, [name, age, gender, phone_number, email_id, hashedPassword], (err, results) => {
            if (err) {
                console.error('Database error during registration:', err); // Log the error details
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully` });
        });
    });
});

module.exports = router;

