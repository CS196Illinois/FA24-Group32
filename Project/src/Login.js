import React, { useState } from 'react';
import {Link} from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
                fetch('http://localhost:5000/run-login', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => console.log(data.message))
                    .catch(err => console.error('Error logging in user'));
                //If login is successful
                setSuccessMessage('Logged in successfully');
                setUsername('');
                setPassword('');
            } else if (response.status === 409) {
                //Username or password is incorrect
                setErrorMessage('Invalid username or password.');
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
                <button type="submit">Create Account</button>
            </form>

            <Link to="/">
                <button className="back-button">Back</button>
            </Link>
        </div>
    );
};

export default Login;
