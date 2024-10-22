const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Use body-parser to handle JSON requests
app.use(bodyParser.json());

// Serve static files from the React app (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to save addresses to JSON
app.post('/save-addresses', (req, res) => {
    const { addresses } = req.body;

    const filePath = path.join(__dirname, 'public', 'addresses.json');
    fs.writeFile(filePath, JSON.stringify(addresses, null, 2), (err) => {
        if (err) {
            console.error('Error saving addresses:', err);
            res.status(500).json({ success: false, message: 'Failed to save addresses.' });
        } else {
            console.log('Addresses saved successfully.');
            res.json({ success: true, message: 'Addresses saved successfully.' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
