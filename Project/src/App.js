// import './App.css';
// import { useState, useEffect } from "react";
// import axios from 'axios';
//
// const App = () => {
//   const [locations, setLocations] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//
//   useEffect(() => {
//     // Sample data for member locations, you can later fetch these from user input or other sources.
//     const memberLocations = ["Grainger Library", "Union", "Oldfather", "Bolt"];
//     const maximumTravelDistance = 1000; // or let the user set this value
//
//     // Call the Flask backend to get optimal locations
//     axios.post('http://127.0.0.1:5000/optimal-location', {
//       memberLocations: memberLocations,
//       maximumTravelDistance: maximumTravelDistance
//     })
//         .then(response => {
//           setLocations(response.data.optimalLocations);
//           setIsLoading(false);
//         })
//         .catch(error => {
//           console.error('Error fetching optimal locations:', error);
//           setIsLoading(false);
//         });
//   }, []);
//
//   return (
//       <div className="App">
//         <h1>Optimal Meeting Locations</h1>
//         {isLoading ? (
//             <p>Loading...</p>
//         ) : (
//             <ul>
//               {locations.map((location, index) => (
//                   <li key={index}>{location}</li>
//               ))}
//             </ul>
//         )}
//       </div>
//   );
// }
//
// export default App;

import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import './App.css';

const center = {
    lat: 40.110588,  // UIUC latitude
    lng: -88.228306  // UIUC longitude
};

const App = () => {
    const [markers, setMarkers] = useState([]);
    const [addresses, setAddresses] = useState(''); // Text input for addresses

    // Function to handle the submission of addresses
    // const handleAddressSubmit = () => {
    //     const addressArray = addresses.split('\n').map(address => address.trim());
    //
    //     // Call backend to save addresses to JSON
    //     fetch('http://localhost:5000/save-addresses', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ addresses: addressArray }),
    //     }).then(response => response.json())
    //         .then(data => {
    //             console.log('Addresses saved:', data);
    //             geocodeAddresses(addressArray);  // Geocode and place markers
    //         })
    //         .catch(error => {
    //             console.error('Error saving addresses:', error);
    //         });
    // };
    //
    // // Function to geocode the addresses and set markers
    // const geocodeAddresses = (addressArray) => {
    //     const geocoder = new window.google.maps.Geocoder();
    //     addressArray.forEach((location) => {
    //         geocoder.geocode({ address: location }, (results, status) => {
    //             if (status === "OK" && results[0]) {
    //                 setMarkers((currentMarkers) => [
    //                     ...currentMarkers,
    //                     { position: results[0].geometry.location }
    //                 ]);
    //             } else {
    //                 console.error("Geocode was not successful for the following reason:", status);
    //             }
    //         });
    //     });
    // };

    useEffect(() => {
        // Fetch addresses from JSON file
        fetch("/places.json")
            .then((response) => response.json())
            .then((data) => {
                const geocoder = new window.google.maps.Geocoder();

                // Geocode the addresses to get lat/lng coordinates
                data.forEach((location) => {
                    geocoder.geocode({ address: location.address }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            setMarkers((currentMarkers) => [
                                ...currentMarkers,
                                {
                                    position: results[0].geometry.location,
                                    label: location.label
                                }
                            ]);
                        } else {
                            console.error("Geocode was not successful for the following reason:", status);
                        }
                    });
                });
            })
            .catch((err) => console.error("Error loading JSON", err));
    }, []);

    return (
        <div className="app-container">
            {/* Sidebar for user input */}
            <div className="sidebar">
                <h2>Enter Addresses</h2>
                <textarea
                    rows="10"
                    cols="30"
                    placeholder="Enter one address per line"
                    value={addresses}
                    onChange={(e) => setAddresses(e.target.value)}
                />
                {/*<button onClick={handleAddressSubmit}>Save Addresses</button>*/}
            </div>

            {/* Google Maps */}
            <LoadScript googleMapsApiKey="API-KEY">
                <GoogleMap mapContainerClassName="map-container" zoom={15} center={center}>
                    {markers.map((marker, index) => (
                        <Marker key={index} position={marker.position} />
                    ))}
                </GoogleMap>
            </LoadScript>
        </div>
    );
};

export default App;
