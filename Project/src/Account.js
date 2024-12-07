import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";
import { Button, Modal, Form, Container, Row, Col } from "react-bootstrap";

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
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetchProtectedData(token);
    }, []);

    const fetchProtectedData = (token) => {
        fetch('http://localhost:5000/get-account', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then((res) => {
                if ([401, 403, 404].includes(res.status)) {
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setUsername(data.username);
                    setAddress(data.address || "Not set");
                }
            });
    };

    const handlePassword = (e) => {
        e.preventDefault();
        setChangingAddress(false);
        setChangingPassword(!changingPassword);
    };

    const submitPassword = async (e) => {
        e.preventDefault();

        if (newPassword === checkPassword) {
            try {
                const response = await fetch('http://localhost:5000/set-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, newPassword })
                });

                if (response.ok) {
                    setChangingPassword(false);
                    alert("Password changed successfully.");
                } else if (response.status === 401) {
                    setErrorMessage("Incorrect password. Please try again.");
                }
            } catch (error) {
                setErrorMessage('An error occurred. Please try again later.');
                console.error('Error:', error);
            }
        } else {
            setErrorMessage("Passwords don't match.");
        }
    };

    const handleLogOut = (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleAddress = (e) => {
        e.preventDefault();
        setChangingPassword(false);
        setChangingAddress(!changingAddress);
    };

    const submitAddress = async (newAddress) => {
        try {
            const response = await fetch('http://localhost:5000/set-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, address: newAddress })
            });

            if (response.ok) {
                setChangingAddress(false);
                alert("Address changed successfully.");
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again later.');
            console.error('Error:', error);
        }
    };

    const handlePlaceSelect = async () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const newAddress = place.formatted_address;
            setAddress(newAddress);
            await submitAddress(newAddress);
        }
    };

    const clearAddress = async () => {
        setAddress("");
        await submitAddress("");
        setChangingAddress(false);
    };

    return (
        <Container>
            <Row className="justify-content-center mt-4">
                <Col md={6} className="text-center">
                    <h2>Username: {username}</h2>
                    <h2>Home Address: {address}</h2>
                    <div className="mt-4">
                        <Link to="/" className="me-2">
                            <Button variant="secondary">Back</Button>
                        </Link>
                        <Button variant="danger" onClick={handleLogOut} className="me-2">Log Out</Button>
                        <Button variant="primary" onClick={handlePassword} className="me-2">
                            {changingPassword ? "Cancel" : "Change Password"}
                        </Button>
                        <Button variant="info" onClick={handleAddress}>
                            {changingAddress ? "Cancel" : "Change Address"}
                        </Button>
                    </div>
                    {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
                </Col>
            </Row>

            {/* Password Modal */}
            <Modal show={changingPassword} onHide={() => setChangingPassword(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={submitPassword}>
                        <Form.Group className="mb-3">
                            <Form.Label>Old Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Old Password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="New Password"
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm Password"
                                onChange={(e) => setCheckPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">Submit</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Address Modal */}
            <Modal show={changingAddress} onHide={() => setChangingAddress(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change Address</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>New Address</Form.Label>
                            <Autocomplete
                                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                onPlaceChanged={handlePlaceSelect}
                            >
                                <Form.Control
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Start typing an address..."
                                />
                            </Autocomplete>
                        </Form.Group>
                        <Button variant="secondary" onClick={clearAddress} className="me-2">Clear Address</Button>
                        <Button variant="primary" onClick={() => setChangingAddress(false)}>Close</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default Account;
