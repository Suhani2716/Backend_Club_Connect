const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');  // Import the database connection

// Add Event
router.post('/add-event', (req, res) => {
    const { eventName, eventDate, eventFees, eventSeats, eventTime, eventVenue, eventCategory, eventDescription } = req.body;

    // Basic validation
    if (!eventName || !eventDate || !eventFees || !eventSeats || !eventTime || !eventVenue || !eventCategory || !eventDescription) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    const query = 'INSERT INTO events_classic_new (event_name, date, fees, seats, time, venue, category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [eventName, eventDate, eventFees, eventSeats, eventTime, eventVenue, eventCategory, eventDescription], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error adding event to database' });
        }
        res.status(200).json({ success: true, message: 'Event added successfully' });
    });
});

// Delete Event
router.delete('/delete-event', (req, res) => {
    console.log(req.body);  // Log the request body
    const { eventName } = req.body; // Now we're using eventName instead of eventId

    if (!eventName) {
        return res.status(400).json({ success: false, message: 'Event name is required' });
    }

    const query = 'DELETE FROM events_classic_new WHERE event_name = ?'; // Query using event_name
    db.query(query, [eventName], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error deleting event from database' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    });
});

// Modify Event by Name and Field
router.put('/modify-event', (req, res) => {
    const { eventName, fieldToModify, newValue } = req.body;

    // Validate the inputs
    if (!eventName || !fieldToModify || !newValue) {
        return res.status(400).json({ success: false, message: 'Event name, field to modify, and new value are required!' });
    }

    let columnToModify;

    // Determine which field needs to be modified
    switch (fieldToModify) {
        case 'date':
            columnToModify = 'date';
            break;
        case 'time':
            columnToModify = 'time';
            break;
        case 'venue':
            columnToModify = 'venue';
            break;
        default:
            return res.status(400).json({ success: false, message: 'Invalid field to modify' });
    }

    // Query to modify the event
    const query = `UPDATE events_classic_new SET ${columnToModify} = ? WHERE event_name = ?`;
    db.query(query, [newValue, eventName], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error modifying event in database' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.status(200).json({ success: true, message: 'Event modified successfully' });
    });
});

// Route to get all events
// Route to get all events
router.get('/view-all-events', (req, res) => {
    const query = `SELECT * FROM events_classic_new WHERE STR_TO_DATE(date, '%Y-%m-%d') >= CURDATE()`; // Convert VARCHAR to DATE for comparison

    // Execute the query to fetch all events
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching events:", err);
            return res.status(500).json({ success: false, message: "Error fetching events." });
        }

        // If no events found
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No events found." });
        }

        // Send the events as response
        res.status(200).json({ success: true, events: results });
    });
});

//View enrollment
// Route to get the list of events for the dropdown in the view
router.get('/get-events', (req, res) => {
    const query = 'SELECT DISTINCT event_name FROM events_classic_new';

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching events:", err);
            return res.status(500).json({ success: false, message: "Error fetching events." });
        }

        res.status(200).json({ success: true, events: results });
    });
});

// Route to get the enrollment data for a specific event
router.get('/view-enrollments', (req, res) => {
    const eventName = req.query.eventName;

    if (!eventName) {
        return res.status(400).json({ success: false, message: 'Event name is required' });
    }

    // Modify query for case-insensitive matching of event names
    const query = `
        SELECT Participant_Name, Email_id, Name_of_the_event
        FROM events_enrollment
        WHERE LOWER(Name_of_the_event) = LOWER(?)`;

    db.query(query, [eventName], (err, results) => {
        if (err) {
            console.error("Error fetching enrollments:", err);
            return res.status(500).json({ success: false, message: "Error fetching enrollments." });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No enrollments found for this event." });
        }

        res.status(200).json({ success: true, enrollments: results });
    });
});

// Filter 
router.post("/filter-events", (req, res) => {
    const { filterField, filterValue } = req.body;

    // Validate the inputs
    if (!filterField || !filterValue) {
        return res.status(400).json({ success: false, message: "Filter field and value are required!" });
    }

    let columnToFilter;

    // Determine which field needs to be filtered
    switch (filterField) {
        case "date":
            columnToFilter = "date";
            break;
        case "category":
            columnToFilter = "category";
            break;
        case "fees":
            columnToFilter = "fees";
            break;
        default:
            return res.status(400).json({ success: false, message: "Invalid filter field" });
    }

    // Construct the query to fetch events including the name
    const query = `SELECT event_name, date, category, fees FROM events_classic_new WHERE ${columnToFilter} = ?`;
    
    db.query(query, [filterValue], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Error fetching events from database" });
        }

        // If no events found
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "No events found" });
        }

        // Return the events data
        res.status(200).json({ success: true, events: result });
    });
});

//Enroll
router.post("/enroll", (req, res) => {
    const { eveName, email, password } = req.body;

    if (!eveName || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const authQuery = "SELECT email_id, password FROM guest_details_final WHERE email_id = ?";
    db.query(authQuery, [email], (err, authResults) => {
        if (err) {
            console.error("Authentication Error:", err);
            return res.status(500).json({ success: false, message: "Error validating credentials." });
        }

        if (authResults.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const hashedPassword = authResults[0].password;
        const isPasswordValid = bcrypt.compareSync(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const checkEnrollmentQuery = "SELECT * FROM events_enrollment WHERE email_id = ? AND Name_of_the_event = ?";
        db.query(checkEnrollmentQuery, [email, eveName], (err, enrollmentResults) => {
            if (err) {
                console.error("Enrollment Check Error:", err);
                return res.status(500).json({ success: false, message: "Error checking enrollment status." });
            }

            if (enrollmentResults.length > 0) {
                return res.status(409).json({ success: false, message: "You are already enrolled in this event." });
            }

            const nameQuery = "SELECT Name FROM guest_details_final WHERE email_id = ?";
            db.query(nameQuery, [email], (err, nameResults) => {
                if (err) {
                    console.error("Name Fetch Error:", err);
                    return res.status(500).json({ success: false, message: "Error fetching participant name." });
                }

                const participantName = nameResults[0]?.Name || "Unknown";

                const enrollQuery = `
                    INSERT INTO events_enrollment (Participant_Name, email_id, Name_of_the_event) 
                    VALUES (?, ?, ?)
                `;
                db.query(enrollQuery, [participantName, email, eveName], (err) => {
                    if (err) {
                        console.error("Enrollment Error:", err);
                        return res.status(500).json({ success: false, message: "Error enrolling in the event." });
                    }

                    res.status(200).json({ 
                        success: true, 
                        message: "Successfully enrolled!" 
                    });
                });
            });
        });
    });
});

//Payment method
router.post("/updatePaymentMethod", (req, res) => {
    const { email, eveName, paymentMethod } = req.body;

    if (!email || !eveName || !paymentMethod) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    if (!['online', 'offline'].includes(paymentMethod)) {
        return res.status(400).json({ success: false, message: "Invalid payment method!" });
    }

    const updateQuery = `
        UPDATE events_enrollment 
        SET payment_method = ? 
        WHERE email_id = ? AND Name_of_the_event = ?
    `;
    db.query(updateQuery, [paymentMethod, email, eveName], (err, results) => {
        if (err) {
            console.error("Update Payment Method Error:", err);
            return res.status(500).json({ success: false, message: "Error updating payment method." });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Enrollment not found!" });
        }

        res.status(200).json({ success: true, message: "Payment method updated successfully!" });
    });
});


// Rate Event Route
router.post("/rate-event", (req, res) => {
    const { eventName, stars, clubName } = req.body;

    if (!eventName || stars == null || !clubName) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    if (stars < 0 || stars > 10) {
        return res.status(400).json({ success: false, message: "Rating must be between 0 and 10." });
    }

    // Check if the event exists
    const eventQuery = "SELECT date FROM events_classic_new WHERE event_name = ?";
    db.query(eventQuery, [eventName], (err, eventResults) => {
        if (err) {
            console.error("Event Fetch Error:", err);
            return res.status(500).json({ success: false, message: "Error checking event existence." });
        }

        if (eventResults.length === 0) {
            return res.status(404).json({ success: false, message: "Event not found." });
        }

    
            // Insert the rating into the Events_Ratings table
            const insertQuery = "INSERT INTO events_ratings (Name, Stars, Club) VALUES (?, ?, ?)";
            db.query(insertQuery, [eventName, stars, clubName], (err) => {
                if (err) {
                    console.error("Rating Insert Error:", err);
                    return res.status(500).json({ success: false, message: "Error submitting rating." });
                }

                res.status(200).json({ success: true, message: "Rating submitted successfully!" });
            });
        });
    });

module.exports = router;
