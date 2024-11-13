const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const {clear} = require("@testing-library/user-event/dist/clear");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
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

// New endpoint to run meetup-locations.py
app.post('/run-meetup-locations', (req, res) => {
    const pythonScriptPath = path.resolve(__dirname, '../meetup_locations.py');  // Adjust path as needed

    exec(`python3 "${pythonScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run Python script' });
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
        }
        console.log(`Python script executed successfully`);
        res.json({ message: 'Python script executed successfully', output: stdout });
    });
});

app.post('/run-register', (req, res) => {
    const pythonScriptPath = path.resolve(__dirname, '../register.py');

    exec(`python3 "${pythonScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error registering user: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run Python script' });
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
        }
        console.log(`Signup script executed successfully`);
        res.json({ message: 'Registered successfully', output: stdout });
    })
})

app.post('/run-login', (req, res) => {
    const pythonScriptPath = path.resolve(__dirname, '../login.py');

    exec(`python3 "${pythonScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error logging in user: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run Python script' })
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
        }
        console.log('Login script executed successfully');
        res.json({ message: 'Login successfully', output: stdout });
    })
})

// Clear places.json after markers are displayed
app.post('/clear-places', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'places.json');
    fs.writeFile(filePath, JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error('Error clearing places.json:', err);
            res.status(500).json({ success: false, message: 'Failed to clear places.' });
        } else {
            //console.log('places.json cleared successfully.');
            res.json({ success: true, message: 'places.json cleared successfully.' });
        }
    });
});

// New Sign-Up Endpoint to pass user credentials to register.json
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const newUser = [username, password];
    const registerFilePath = path.join(__dirname, 'public', 'register.json');
    const userFilePath = path.join(__dirname, 'public', 'users.json');
    let duplicate = false

    fs.readFile(userFilePath, 'utf8', (err, usersData) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Error reading users.' });
        }

        let users = {};
        if (usersData) {
            users = JSON.parse(usersData);
        }

        for (i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                duplicate = true;
            }
        }
    })

    if (duplicate) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    //Add new user
    fs.writeFile(registerFilePath, '', (clearErr) => {
        if (clearErr) {
            console.error("Error clearing register.json", clearErr);
            return res.status(500).json({ message: 'Failed to clear register.json.' });
        }
        // Write updated data back to the file
        fs.writeFile(registerFilePath, JSON.stringify(newUser, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving register file' });
            }
            return res.status(201).json({ message: 'User registered successfully' });
        });
    })
});

//New Login Endpoint to pass user credentials to login.json
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const loginFilePath = path.join(__dirname, 'public', 'login.json');
    const userFilePath = path.join(__dirname, 'public', 'users.json');

    fs.readFile(userFilePath, 'utf8', (err, usersData) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ message: 'Error reading users' });
        }

        let users = [];
        if (usersData) {
            users = JSON.parse(usersData);
        }

        //Check if username exists
        if (!users[username] || users[password] !== password) {
            return res.status(409).json({ message: 'Invalid username or password' });
        }
    })

});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
