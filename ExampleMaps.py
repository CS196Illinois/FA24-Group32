from flask import Flask, request, jsonify
import googlemaps
from datetime import datetime
import config
import json

MEETUP_SPOTS = [
    {"name": "Ikenberry Dining Center (IKE)", "address": "301 E. Gregory Drive, Champaign"},
    {"name": "Illinois Street Dining Center (ISR)", "address": "1010 W. Illinois, Urbana"},
    {"name": "Lincoln Avenue Dining Hall (LAR)", "address": "1005 S. Lincoln, Urbana"},
    {"name": "Pennsylvania Avenue Dining Hall (PAR)", "address": "906 W. College Ct., Urbana"},
]

app = Flask(__name__)

# Initialize Google Maps client
API_KEY = "API-KEY"
gmaps = googlemaps.Client(API_KEY)

def get_user_locations():
    with open('public/addresses.json', 'r') as file:
        return json.load(file)

def send_to_places(output):
    with open('public/places.json', 'w') as file:
        json.dump(output, file)
        

def geocode_address(address):
    """
    Geocode an address to get latitude and longitude.
    """
    geocode_result = gmaps.geocode(address)
    if not geocode_result:
        raise ValueError(f"Geocoding failed for address: {address}")
    location = geocode_result[0]['geometry']['location']
    return f"{location['lat']},{location['lng']}"

def get_best_meetup_spot(user_locations):
    """
    Calculate the best meetup spot based on the shortest average distance.
    """
    origin_addresses = []
    for loc in user_locations:
        if isinstance(loc, str):
            # Assume it's an address
            origin = geocode_address(loc)
        elif isinstance(loc, dict) and 'lat' in loc and 'lng' in loc:
            origin = f"{loc['lat']},{loc['lng']}"
        else:
            raise ValueError("Invalid location format. Provide address string or dict with 'lat' and 'lng'.")
        origin_addresses.append(origin)

    # Prepare destination addresses (meetup spots)
    destination_addresses = []
    spot_names = []
    for spot in MEETUP_SPOTS:
        destination = geocode_address(spot['address'])
        destination_addresses.append(destination)
        spot_names.append(spot['name'])

    # Request distance matrix
    distance_matrix = gmaps.distance_matrix(
        origins=origin_addresses,
        destinations=destination_addresses,
        mode="walking",
        departure_time=datetime.now()
    )

    if distance_matrix['status'] != 'OK':
        raise Exception("Error fetching distance matrix from Google Maps API.")

    # Calculate average distance to each meetup spot
    spot_distances = []
    for idx, destination in enumerate(destination_addresses):
        total_distance = 0
        for origin_idx, origin in enumerate(origin_addresses):
            element = distance_matrix['rows'][origin_idx]['elements'][idx]
            if element['status'] != 'OK':
                # Handle cases where distance couldn't be calculated
                distance = float('inf')
            else:
                distance = element['distance']['value']  # distance in meters
            total_distance += distance
        average_distance = total_distance / len(origin_addresses)
        spot_distances.append(average_distance)

    # Find the meetup spot with the minimum average distance
    min_distance = min(spot_distances)
    best_spot_index = spot_distances.index(min_distance)
    best_spot = MEETUP_SPOTS[best_spot_index]

    return best_spot

@app.route('/api/best_meetup', methods=['POST'])
def best_meetup():
    """
    Endpoint to get the best meetup spot.
    Expects JSON payload with a list of user locations.
    Example:
    {
        "user_locations": [
            "1600 Amphitheatre Parkway, Mountain View, CA",
            {"lat": 40.712776, "lng": -74.005974},
            "1 Infinite Loop, Cupertino, CA"
        ]
    }
    """
    data = request.get_json()
    if not data or 'user_locations' not in data:
        return jsonify({"error": "Missing 'user_locations' in request body."}), 400

    user_locations = data['user_locations']
    try:
        best_spot = get_best_meetup_spot(user_locations)
        return jsonify({
            "best_meetup_spot": best_spot['name'],
            "address": best_spot['address']
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    #app.run(debug=True)
    send_to_places(get_best_meetup_spot(get_user_locations()))
