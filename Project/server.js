const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// Use body-parser to handle JSON requests
app.use(bodyParser.json());

// Use cors middleware
app.use(cors());

// Serve static files from the React app
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

// New endpoint to run ExampleMaps.py with full path
app.post('/run-example-maps', (req, res) => {
    const pythonScriptPath = path.resolve(__dirname, '../ExampleMaps.py');  // Adjust this path as needed

    exec(`python3 "${pythonScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run Python script' });
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
        }
        console.log(`Python script output: ${stdout}`);
        res.json({ message: 'Python script executed successfully', output: stdout });
    });
});

// Clear places.json after markers are displayed
app.post('/clear-places', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'places.json');
    fs.writeFile(filePath, JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error('Error clearing places.json:', err);
            res.status(500).json({ success: false, message: 'Failed to clear places.' });
        } else {
            console.log('places.json cleared successfully.');
            res.json({ success: true, message: 'places.json cleared successfully.' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
