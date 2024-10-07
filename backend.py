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

#returns the best location/s for the group
def find_optimal_locations(locations, maximumTravelDistance):
    '''
    locations will be an array of dictionaries containing the possible locations the group can meet at 
    each dictionary in locations will have the name stored as locations[i]['name']
    there will be another field locations[i]['travelTimes'] that will store the travel time of each group member from the location (more fields can be added later)
    maximumTravelDistance refers to the maximum distance any group member should have to travel 
    (e.g. you might prefer to go to something that is 10 minutes away from everyone rather than something that is 30 minutes away from one person and 1 minute away from 3 other people
    Can add more of these requirements later
    '''
    fulfillsAllReqs = {}
    otherLocations = {}

    if not locations:
        raise ValueError("The list of locations is empty.")
    
    for location in locations:
        #note, we can develop a more sophisticated way to score a location than just the sum of times
        sumTimes = sum(location['travelTimes'])
        times = location['travelTimes']
        times.sort()
        if (times[-1] > maximumTravelDistance):
            otherLocations[location['name']] = sumTimes
        else:
            fulfillsAllReqs[location['name']] = sumTimes

    if fulfillsAllReqs != {}:
        #efficient way to find minimum key in a dictionary: https://www.geeksforgeeks.org/python-minimum-value-keys-in-dictionary/
        res =  [key for key in fulfillsAllReqs if
        all(fulfillsAllReqs[temp] >= fulfillsAllReqs[key]
        for temp in fulfillsAllReqs)]
    else:
        res =  [key for key in otherLocations if
        all(otherLocations[temp] >= otherLocations[key]
        for temp in otherLocations)]

    return res
        
    

if __name__ == "__main__":
    print(get_walk_time("Illini Union", "Grainger Library", config.api_key))
