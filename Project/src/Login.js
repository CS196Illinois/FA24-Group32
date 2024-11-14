import React, { useState } from 'react';
import {Link, useNavigate} from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                setSuccessMessage("Logged in successfully.");
                navigate('/account')
            } else if (response.status === 409) {
                setErrorMessage("Username or password is incorrect.");
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
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>
                        Username:
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <button type="submit">Log In</button>
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
};

export default Login;
