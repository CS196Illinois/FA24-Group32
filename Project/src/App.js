// src/App.js
import React, { useState, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SignUp from './SignUp';
import { GoogleMap, Marker, LoadScript, Autocomplete } from "@react-google-maps/api";
import './App.css';

const center = {
    lat: 40.110588,  // UIUC latitude
    lng: -88.228306  // UIUC longitude
};

const MainPage = () => {
    const [markers, setMarkers] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current.getPlace();
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
                return fetch('http://localhost:5000/run-example-maps', { method: 'POST' });
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

    // Callback to be triggered when the map loads to ensure markers are added only after map is ready
    const handleMapLoad = () => {
        fetchPlacesAndAddMarkers();
    };

    return (
        <div className="app-container">
            <div className="sidebar">
                <h2>Enter Address</h2>

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

                <button onClick={handleAddressSubmit}>Save Addresses</button>

                <ul>
                    {addresses.map((address, index) => (
                        <li key={index}>{address}</li>
                    ))}
                </ul>

                <Link to="/signup">
                    <button className="signup-button">Login / Sign Up</button>
                </Link>
            </div>

            <div className="map-container">
                <GoogleMap mapContainerClassName="map" zoom={15} center={center} onLoad={handleMapLoad}>
                    {markers.map((marker, index) => (
                        <Marker key={index} position={marker.position} label={marker.label} />
                    ))}
                </GoogleMap>
            </div>
        </div>
    );
};

const App = () => (
    <LoadScript googleMapsApiKey="API-KEY" libraries={["places"]}>
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/signup" element={<SignUp />} />
            </Routes>
        </Router>
    </LoadScript>
);

export default App;
