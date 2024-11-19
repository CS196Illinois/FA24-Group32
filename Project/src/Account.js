import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import {Autocomplete} from "@react-google-maps/api";

function Account() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [address, setAddress] = useState("");
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);

    const [changingPassword, setChangingPassword] = useState(false);
    const [changingAddress, setChangingAddress] = useState(false);

    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetchProtectedData(token)
    }, [])

    const fetchProtectedData = (token) => {
        fetch('http://localhost:5000/get-account', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then((res) => {
                if (res.status === 401 || res.status === 403 || res.status === 404) {
                    alert('Your session has expired. Please log in again.')
                    localStorage.removeItem('token');
                    navigate('/login')
                }
                return res.json()
            })
            .then((data) => {
                if (data) {
                    setUsername(data.username);
                    if (data.address) {
                        setAddress(data.address);
                    } else {
                        setAddress("Not set")
                    }
                }
            })
    }

    const handlePassword = async (e) => {
        e.preventDefault();
        if (changingAddress) {
            setChangingAddress(false);
        }
        setChangingPassword(!changingPassword);
    }

    const submitPassword = async (e) => {
        e.preventDefault();

        if (newPassword === checkPassword) {
            try {
                const response = await fetch('http://localhost:5000/set-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password, newPassword })
                })

                if (response.ok) {
                    setChangingPassword(false);
                    alert("Password changed successfully.")
                } else if (response.status === 401) {
                    setErrorMessage("Incorrect password. Please try again.")
                }
            } catch (error) {
                setErrorMessage('An error occurred. Please try again later.')
                console.error('Error:', error);
            }

        } else {
            setErrorMessage("Passwords don't match.");
        }
    }

    const handleLogOut = async (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        navigate('/');
    }

    const handleAddress = async (e) => {
        e.preventDefault();
        if (changingPassword) {
            setChangingPassword(false);
        }
        setChangingAddress(!changingAddress);
    }

    const submitAddress = async (newAddress) => {
        try {
            const response = await fetch('http://localhost:5000/set-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, address: newAddress })
            })

            if (response.ok) {
                setChangingAddress(false);
                console.log("changed")
                alert("Address changed successfully.")
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again later.')
            console.error('Error:', error);
        }
    }

    const handlePlaceSelect = async () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const newAddress = (place.formatted_address)
            setAddress(newAddress);
            console.log(address)
            try {
                await submitAddress(newAddress);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    return (
        <div>
            <div >
                <h2>Username: {username}</h2>
                <h2>Home Address: {address}</h2>
            </div>
            {changingPassword && (
                <div>
                    <form onSubmit={submitPassword}>
                        <div>
                            <label>
                                Old Password:
                                <input
                                    type="password"
                                    placeholder={"Old Password"}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                New Password:
                                <input
                                    type="password"
                                    placeholder={"New Password"}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                Confirm New Password:
                                <input
                                    type="password"
                                    placeholder={"Confirm Password"}
                                    onChange={(e) => setCheckPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            )}

            {changingAddress && (
                <div>
                    <div>
                        <label>
                            New Address:
                            <Autocomplete
                                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                onPlaceChanged={handlePlaceSelect}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                        placeholder="Start typing an address..."
                                    style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                                />
                            </Autocomplete>
                        </label>
                    </div>
                </div>
            )}
            <div style={{display: "flex"}}>
                <Link to="/">
                    <button className="back-button">Back</button>
                </Link>

                <button onClick={handlePassword}>
                    {changingPassword ? "Cancel" : "Change Password"}
                </button>

                <button onClick={handleLogOut}>
                    Log Out
                </button>

                <button onClick={handleAddress}>
                    {changingAddress ? "Cancel" : "Change Address"}
                </button>
            </div>

            {/* Display error message if it exists */}
            {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}

        </div>

    );
}

export default Account;