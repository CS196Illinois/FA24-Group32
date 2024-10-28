from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

api_key = "AIzaSyDdPQv02MWF7RuEzp-E-n7nHF_YBhSemlc"
diningHalls = ("Ikenberry Dining Center", "Illinois Street Dining Center", "Lincoln Avenue Dining Hall (LAR Dining Hall)", "Pennsylvania Avenue (PAR) Dining Hall")
places = ("Grainger Library", "Union", "Oldfather", "Bolt")

def get_walk_time(origin, destination, api_key):
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&mode=walking&key={api_key}"
    response = requests.get(url).json()
    if response["status"] == "OK":
        #print(response) #for debug purposes
        return response["rows"][0]["elements"][0]["duration"]["value"]/60
    else:
        return "Error"

def calculate_centroid(locations):
    if not locations:
        raise ValueError("The list of locations is empty.")

    latitude = sum(lat for lat, lng in locations) / len(locations)
    longitude = sum(lng for lat, lng in locations) / len(locations)

    return (latitude, longitude)

def build_locations(memberLocations, destinations, api_key):
    #destinations is the list of destinations, we use diningHalls for the MVP. memberLocations is the list of group member's locations

    if not destinations:
        raise ValueError("The list of destinations is empty.")

    if not memberLocations:
        raise ValueError("The list of member locations is empty")

    locations = []

    for destination in destinations:
        #print(destination)
        travelTime = []
        for memberLocation in memberLocations:
            travelTime.append(get_walk_time(memberLocation, destination, api_key))
        locations.append({'name': destination, 'travelTimes': travelTime})

    return locations

def find_optimal_locations(memberLocations, destinations, api_key, maximumTravelDistance):
    '''
    locations will be an array of dictionaries containing the possible locations the group can meet at
    each dictionary in locations will have the name stored as locations[i]['name']
    there will be another field locations[i]['travelTimes'] that will store the travel time of each group member from the location (more fields can be added later)
    maximumTravelDistance refers to the maximum distance any group member should have to travel
    (e.g. you might prefer to go to something that is 10 minutes away from everyone rather than something that is 30 minutes away from one person and 1 minute away from 3 other people
    Can add more of these requirements later
    '''
    locations = build_locations(memberLocations, destinations, api_key)

    fulfillsAllReqs = {}
    otherLocations = {}

    if not locations:
        raise ValueError("The list of locations is empty.")

    for location in locations:
        #note, we can develop a more sophisticated way to score a location than just the sum of times
        sumTimes = sum(location['travelTimes'])
        if (max(location['travelTimes']) > maximumTravelDistance):
            otherLocations[location['name']] = sumTimes
        else:
            fulfillsAllReqs[location['name']] = sumTimes

    if fulfillsAllReqs != {}:
        #efficient way to find minimum key in a dictionary: https://www.geeksforgeeks.org/python-minimum-value-keys-in-dictionary/
        res =  [key for key in fulfillsAllReqs if
        all(fulfillsAllReqs[temp] >= fulfillsAllReqs[key]
        for temp in fulfillsAllReqs)][0]
    else:
        res =  [key for key in otherLocations if
        all(otherLocations[temp] >= otherLocations[key]
        for temp in otherLocations)][0]
        print("Over max time")

    return res

# Add a root route to handle the default path.
@app.route('/')
def index():
    return "Flask server is running!"

@app.route('/optimal-location', methods=['POST'])
def get_optimal_location():
    data = request.json
    print("Received data from frontend:", data)
    memberLocations = data.get('memberLocations')
    maximumTravelDistance = data.get('maximumTravelDistance', 1000)

    if not memberLocations:
        return jsonify({'error': 'No member locations provided'}), 400

    locations = build_locations(diningHalls, memberLocations, api_key)
    print("Generated locations:", locations)

    optimal_locations = find_optimal_locations(locations, maximumTravelDistance)
    print("Optimal locations found:", optimal_locations)

    return jsonify({'optimalLocations': optimal_locations})

if __name__ == "__main__":
    app.run(debug=True)