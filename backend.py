import requests
import config

def get_walk_time(origin, destination, api_key):
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&mode=walking&key={api_key}"
    response = requests.get(url).json()
    if response["status"] == "OK":
        #print(response) #for debug purposes
        return response["rows"][0]["elements"][0]["duration"]["value"]
    else:
        return "Error"

#calculate centroid is used for finding a list of restaurants near a group of locations, but I guess we won't be using it for the MVP since we have a fixed list of dining halls.
def calculate_centroid(locations):
    if not locations:
        raise ValueError("The list of locations is empty.")
    
    latitude = sum(lat for lat, lng in locations) / len(locations)
    longitude = sum(lng for lat, lng in locations) / len(locations)
    
    return (latitude, longitude)

diningHalls = ("Ikenberry Dining Center", "Illinois Street Dining Center", "Lincoln Avenue Dining Hall (LAR Dining Hall)", "Pennsylvania Avenue (PAR) Dining Hall")

#build the locations array based on fixed list of destinations and member's locations
def build_locations(destinations, memberLocations, api_key):
    #destinations is the list of destinations, we use diningHalls for the MVP. memberLocations is the list of group member's locations
    
    if not destinations:
        raise ValueError("The list of destinations is empty.")
    
    if not memberLocations:
        raise ValueError("The list of member locations is empty")
    
    locations = []

    for destination in destinations:
        travelTime = []
        for memberLocation in memberLocations:
            travelTime.append(get_walk_time(memberLocation, destination, api_key))
        locations.append({'name': destination, 'travelTimes': travelTime})
    
    return locations

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
    #print(get_walk_time("Ikenberry Dining Center", "Grainger Library", config.api_key))
    print(find_optimal_locations(build_locations(diningHalls, places, config.api_key), 1000))