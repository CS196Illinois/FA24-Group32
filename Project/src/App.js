import './App.css';
import { GoogleMap, useLoadScript} from "@react-google-maps/api";
import { useMemo } from "react";
import config from "./config";

const App = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: config.API_KEY,
  });
  const center = useMemo(() => ({ lat: 40.107, lng: -88.23}), [])

  return (
      <div className="App">
        {!isLoaded ? (
            <h1>Loading...</h1>
        ) : (
            <GoogleMap
              mapContainerClassName="map-container"
              center={center}
              zoom={16}
            />
        )}
      </div>
  )
}

export default App;
