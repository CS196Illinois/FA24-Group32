import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";

function Account() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [address, setAddress] = useState("");
    const navigate = useNavigate();
    const [changingPassword, setChangingPassword] = useState(false);

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
        setChangingPassword(!changingPassword);
    }

    const submitPassword = async (e) => {
        e.preventDefault();

        console.log("submit");
    }

    return (
        <div>
            <div >
                <h2>Username: {username}</h2>
                <h2>Home Address: {address}</h2>
            </div>
            {changingPassword && (
                <div id={"changePassword"}>
                    <form onSubmit={submitPassword}>
                        <div>
                            <label>
                                Old Password:
                                <input
                                    type="text"
                                    value={password}
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
                                    value={newPassword}
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
                                    value={checkPassword}
                                    onChange={(e) => setCheckPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            )}
            <div style={{display: "flex"}}>
                <Link to="/">
                    <button className="back-button">Back</button>
                </Link>

                <button className="account-button" onClick={handlePassword} id={"passwordButton"}>
                    {changingPassword ? "Cancel" : "Change Password"}
                </button>

            </div>
        </div>

    );
}

export default Account;