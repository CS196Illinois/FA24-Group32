import React, { useState, useRef } from "react";
import { GoogleMap, Marker, LoadScript, Autocomplete } from "@react-google-maps/api";
import './App.css';

const center = {
    lat: 40.110588,  // UIUC latitude
    lng: -88.228306  // UIUC longitude
};

const App = () => {
    const [markers, setMarkers] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);

    // Handle selection of a place from Autocomplete
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
                fetchPlacesAndAddMarkers();  // Fetch places.json and add markers
            })
            .catch(error => {
                console.error('Error saving addresses:', error);
            });
    };

    // Function to fetch places.json and geocode addresses
    const fetchPlacesAndAddMarkers = () => {
        fetch('/places.json')
            .then((response) => response.json())
            .then((data) => {
                const geocoder = new window.google.maps.Geocoder();

                data.forEach((place) => {
                    geocoder.geocode({ address: place.address }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            setMarkers((currentMarkers) => [
                                ...currentMarkers,
                                { position: results[0].geometry.location, label: place.label },
                            ]);
                        } else {
                            console.error("Geocode was not successful:", status);
                        }
                    });
                });

                // Clear places.json after displaying markers
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
        <LoadScript googleMapsApiKey="API-KEY" libraries={["places"]}>
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
                </div>
                <GoogleMap
                    mapContainerClassName="map-container"
                    zoom={15}
                    center={center}
                    onLoad={handleMapLoad}  // Ensures markers load only when the map is fully loaded
                >
                    {markers.map((marker, index) => (
                        <Marker key={index} position={marker.position} label={marker.label} />
                    ))}
                </GoogleMap>
            </div>
        </LoadScript>
    );
};

export default App;
