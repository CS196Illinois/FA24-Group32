import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import SignUp from "./SignUp";
import Login from "./Login";
import Account from "./Account";
import { GoogleMap, Marker, LoadScript, Autocomplete } from "@react-google-maps/api";
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css'
import data from "bootstrap/js/src/dom/data";
import { getUserLocation, showError } from './locationUtils';

const center = {
    lat: 40.110588,  // UIUC latitude
    lng: -88.228306  // UIUC longitude
};

const MainPage = () => {
    const [markers, setMarkers] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [home, setHome] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [useHome, setUseHome] = useState(false);
    const [useCurrent, setUseCurrent] = useState(false)

        useEffect(() => {
            const token = localStorage.getItem('token');
            fetchProtectedData(token);

        getUserLocation(
            (position) => {
                const { latitude, longitude } = position.coords;
                const geocoder = new window.google.maps.Geocoder();
                const location = { lat: latitude, lng: longitude };

                geocoder.geocode({ location }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        const place = {
                            formatted_address: results[0].formatted_address,
                            geometry: {
                                location: new window.google.maps.LatLng(latitude, longitude),
                            },
                        };
                        setUserLocation(place); // Save Place object
                    } else {
                        console.error("Geocode failed:", status);
                    }
                });
            },
            (error) => {
                showError(error);
                console.error('Error getting location:', error);
                setUserLocation(null);
            }
        );
    }, []);

    const fetchProtectedData = (token) => {
        fetch('http://localhost:5000/get-account', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then((res) => {
                if (res.status === 401 || res.status === 403 || res.status === 404) {
                    setLoggedIn(false)
                } else {
                    setLoggedIn(true);
                }
                return res.json()
            })
            .then((data) => {
                setUsername(data.username);
                setHome(data.address)
            })
    }

    const handlePlaceSelect = (place) => {
        //const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const newAddress = place.formatted_address;
            const location = place.geometry.location;

            setAddresses((prev) => [...prev, newAddress]);
            setMarkers((prevMarkers) => [
                ...prevMarkers,
                { position: { lat: location.lat(), lng: location.lng() } }
            ]);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    // Function to submit all addresses to the backend and fetch places.json
    const handleAddressSubmit = () => {
        fetch('http://localhost:5000/save-addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addresses: addresses }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Addresses saved:', data);

                // Trigger the Python script after saving addresses
                return fetch('http://localhost:5000/run-meetup-locations', { method: 'POST' });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Python script executed:', data);
                fetchPlacesAndAddMarkers();  // Fetch places.json and add markers if needed
            })
            .catch(error => {
                console.error('Error saving addresses or running Python script:', error);
            });
    };

    const fetchPlacesAndAddMarkers = () => {
        fetch('/places.json')
            .then((response) => response.json())
            .then((data) => {
                const geocoder = new window.google.maps.Geocoder();

                if (Array.isArray(data)) {
                    // Handle multiple entries
                    data.forEach((place) => {
                        geocoder.geocode({ address: place.address }, (results, status) => {
                            if (status === "OK" && results[0]) {
                                setMarkers((currentMarkers) => [
                                    ...currentMarkers,
                                    { position: results[0].geometry.location, label: place.name },
                                ]);
                            } else {
                                console.error("Geocode was not successful:", status);
                            }
                        });
                    });
                } else {
                    // Handle single entry
                    geocoder.geocode({ address: data.address }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            setMarkers((currentMarkers) => [
                                ...currentMarkers,
                                { position: results[0].geometry.location, label: data.name },
                            ]);
                        } else {
                            console.error("Geocode was not successful:", status);
                        }
                    });
                }

                // Call /clear-places endpoint after attempting to add all markers
                fetch('http://localhost:5000/clear-places', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => console.log(data.message))
                    .catch(err => console.error("Error clearing places.json", err));
            })
            .catch((err) => console.error("Error loading places.json", err));
    };

    const handleHomeAddress = () => {
        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ address: home }, (results, status) => {
            if (status === "OK" && results[0]) {
                const place = {
                    formatted_address: results[0].formatted_address,
                    geometry: {
                        location: results[0].geometry.location,
                    }
                }
                handlePlaceSelect(place)
            } else {
                console.error("Geocode not successful: ", status)
            }
        })

        setUseHome(true)
    }

    const handleCurrentAddress = () => {
        handlePlaceSelect(userLocation)
        setUseCurrent(true)
    }

    // Callback to be triggered when the map loads to ensure markers are added only after map is ready
    const handleMapLoad = () => {
        fetchPlacesAndAddMarkers();
    };

    return (
        <>
            <Navbar bg="light" expand="lg">
                <Container fluid>
                    <Navbar.Brand href="/" className="brand-style">
                        SpotFinder
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto d-flex align-items-center">
                            {!loggedIn ? (
                                <>
                                    <Link to="/signup">
                                        <Button variant="outline-primary" className="me-2">
                                            Sign Up
                                        </Button>
                                    </Link>
                                    <Link to="/login">
                                        <Button variant="outline-secondary">Login</Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <span className="navbar-text me-2">Welcome, {username}</span>
                                    <Link to="/account">
                                        <Button variant="outline-info">Account</Button>
                                    </Link>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div className="app-container">
                <div className="sidebar">
                    <h4>Enter Address</h4>

                    <Autocomplete
                        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                        onPlaceChanged={() => handlePlaceSelect(autocompleteRef.current.getPlace())}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Start typing an address..."
                            style={{width: "100%", padding: "10px", marginBottom: "10px"}}
                        />
                    </Autocomplete>

                    <Button variant="primary" onClick={handleAddressSubmit} className="w-100 mb-3">
                        Save Addresses
                    </Button>

                    <ul>
                        {addresses.map((address, index) => (
                            <li key={index}>{address}</li>
                        ))}
                    </ul>

                    {home && !useHome && (
                        <Button variant={"secondary"} onClick={handleHomeAddress} className="w-100 mb-3">
                            Use Home Address
                        </Button>
                    )}

                    {!useCurrent && (
                        <Button variant={"secondary"} onClick={handleCurrentAddress} className="w-100 mb-3">
                            Use Current Address
                        </Button>
                    )}

                    <h5>Filter by:</h5>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault"/>
                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                            Dining Halls
                        </label>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault"/>
                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                            Restaurants
                        </label>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault"/>
                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                            Gyms
                        </label>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault"/>
                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                            Libraries
                        </label>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault"/>
                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
                            Dorms
                        </label>
                    </div>
                </div>

                <div className={"map-container"}>
                    <GoogleMap mapContainerClassName="map" mapContainerStyle={{width: "100%", height: "100%"}} zoom={15}
                               center={center} onLoad={handleMapLoad}>
                        {markers.map((marker, index) => (
                            <Marker key={index} position={marker.position} label={marker.label}/>
                        ))}
                    </GoogleMap>
                </div>
            </div>
        </>
    );
    }
;

const App = () => (
    <LoadScript googleMapsApiKey="AIzaSyDdPQv02MWF7RuEzp-E-n7nHF_YBhSemlc" libraries={["places"]}>
        <Router>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/signup" element={<SignUp/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/account" element={<Account/>}/>
            </Routes>
        </Router>
    </LoadScript>
);

export default App;
