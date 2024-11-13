import React, { useState } from 'react';
import {Link} from "react-router-dom";

function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();

        // Clear any previous messages
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                fetch('http://localhost:5000/run-register', { method: 'POST'})
                    .then(response => response.json())
                    .then(data => console.log(data.message))
                    .catch(err => console.error('Error registering user'));
                // If registration is successful
                setSuccessMessage('User registered successfully');
                setUsername('');
                setPassword('');
            } else if (response.status === 409) {
                // If username already exists
                setErrorMessage('Username already exists. Please choose a different one.');
            } else {
                setErrorMessage('An error occurred. Please try again later.');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again later.');
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <h2>Signup</h2>
            <form onSubmit={handleSignup}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Sign Up</button>
            </form>

            <Link to="/">
                <button className="back-button">Back</button>
            </Link>

            {/* Display error message if it exists */}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {/* Display success message if registration was successful */}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        </div>
    );
}

export default Signup;
