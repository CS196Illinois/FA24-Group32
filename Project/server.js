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

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Use a strong secret in production

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided.' })
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token. '})
        }
        req.user = user;
        next();
    })
}

let userMap = new Map()

// User object
class User {
    constructor(username, password, address) {
        this.username = username;
        this.password = password;
        this.address = address;
    }
}

// Checked object is returned by checkUsers
class Checked {
    constructor(users, test) {
        this.users = users;
        this.test = test;
    }
}

// Passed signup (boolean) will tell function if signup or login called it
// true for signup
// false for login
function checkUsers(signup, username, password) {
    return new Promise((resolve, reject) => {
        let test = false
        let users = []

        fs.readFile(path.join(__dirname, 'public', 'users.json'), 'utf8', (err, usersData) => {
            if (err) {
                console.error(err);
                console.log('Error while reading users.json');
                return reject(new Checked(users, test));
            } else {
                if (usersData) {
                    users = JSON.parse(usersData);
                }

                // Check if users.json has changed
                // This code is slightly redundant since as long as other code works,
                // the map should always be updated. This is here just in case it isn't for some reason.
                if (userMap.size !== users.length) {
                    //Sets new userMap if users.json has changed
                    userMap = new Map()
                    for (let user of users) {
                        userMap.set(user.username, user);
                    }
                }

                if (userMap.has(username)) {
                    if (signup) {
                        // If signup, set test to true to indicate the username is taken
                        test = true;
                        return resolve(new Checked(users, test));
                    } else if (userMap.get(username).password === password) {
                        // If login, set test to true if password also matches
                        test = true;
                        return resolve(new Checked(users, test));
                    } else {
                        // If login but password is incorrect, leave test as false
                        return resolve(new Checked(users, test));
                    }
                }
                // If username isn't found, leave test as false
                return resolve(new Checked(users, test));
            }
        })
    })
}

function updateUsers(userMap) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(Array.from(userMap.values()), null, 2), (err) => {
            if (!err) {
                return resolve;
            } else {
                return reject
            }
        })
    })
}

// Save addresses to addresses.json
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

// Run meetup-locations.py
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

// Clear places.json after markers are displayed
app.post('/clear-places', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'places.json');
    fs.writeFile(filePath, JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error('Error clearing places.json:', err);
            res.status(500).json({ success: false, message: 'Failed to clear places.' });
        } else {
            res.json({ success: true, message: 'places.json cleared successfully.' });
        }
    });
});

// Sign-up endpoint to create new user
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    const newUser = new User(username, password, "");

    checkUsers(true, username).then((check) => {
        if (check.test) {
            return res.status(409).json({ message: 'Username taken.' });
        }

        //Update userMap to reflect new user
        userMap.set(username, newUser);

        //Add new user to users.json
        fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(Array.from(userMap.values()), null, 2), (err) => {
            if (err) {
                return res.status(500)
            }
            const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
            return res.status(201).json({ message: 'User registered successfully.', token });
        })
    }). catch(err => console.log(err));

});

//Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    checkUsers(false, username, password).then((check) => {
        if (!check.test) {
            return res.status(409).json({ message: 'Username or password is incorrect.' });
        }
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
        return res.status(200).json({ message: 'Logged in successfully.', token });
    })
});

app.get('/get-account', authenticateToken, (req, res) => {
    const { username } = req.user;
    const user = userMap.get(username);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        username: user.username,
        address: user.address,
    });
});

app.post('/set-password', async (req, res) => {
    const {username, password, newPassword} = req.body;
    const user = userMap.get(username);

    if (user.password === password) {
        user.password = newPassword;
        userMap.set(username, user);
        if (await updateUsers(userMap)) {
            return res.status(201).json({message: 'User updated successfully.'});
        } else {
            return res.status(500)
        }
    } else {
        return res.status(401).json({message: 'Password is incorrect.'});
    }
})

app.post('/set-address', async (req, res) => {
    const {username, address} = req.body;
    const user = userMap.get(username);

    user.address = address;
    userMap.set(username, user);
    if (await updateUsers(userMap)) {
        return res.status(201).json({message: 'User updated successfully.'});
    } else {
        return res.status(500)
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});