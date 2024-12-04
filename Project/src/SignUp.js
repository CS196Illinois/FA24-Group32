import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";

const SignUp = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                navigate("/account");
            } else {
                setErrorMessage(data.message || "Sign up failed. Please try again.");
            }
        } catch (error) {
            setErrorMessage("An error occurred. Please try again later.");
        }
    };

    return (
        <Container className="d-flex vh-100">
            <Row className="align-items-center justify-content-center w-100">
                <Col md={6} lg={4}>
                    <h2 className="text-center">Sign Up</h2>
                    <Form onSubmit={handleSignup}>
                        <Form.Group>
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label style={{ marginTop: "10px" }}>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary" block style={{ marginTop: "10px" }}>
                            Sign Up
                        </Button>
                    </Form>
                    <Link to="/" className="btn btn-link">
                        Back
                    </Link>
                    {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}
                </Col>
            </Row>
        </Container>
    );
};

export default SignUp;
