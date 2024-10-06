import requests
import config

def get_walk_time(origin, destination, api_key):
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&mode=walking&key={api_key}"
    response = requests.get(url).json()
    if response["status"] == "OK":
        #print(response)
        return response["rows"][0]["elements"][0]["duration"]["text"]
    else:
        return "Error"

def calculate_centroid(locations):
    if not locations:
        raise ValueError("The list of locations is empty.")
    
    latitude = sum(lat for lat, lng in locations) / len(locations)
    longitude = sum(lng for lat, lng in locations) / len(locations)
    
    return (latitude, longitude)

if __name__ == "__main__":
    print(get_walk_time("Illini Union", "Grainger Library", config.api_key))